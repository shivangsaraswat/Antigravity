"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

// Types
export interface Message {
    id: string;
    role: 'user' | 'ai';
    content: string;
    sources?: any[];
    timestamp: number;
}

export interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    timestamp: number;
}

interface ChatContextType {
    sessions: ChatSession[];
    currentSessionId: string | null;
    currentMessages: Message[];
    loading: boolean;
    createNewSession: () => void;
    selectSession: (sessionId: string) => void;
    sendMessage: (content: string) => Promise<void>;
    deleteSession: (sessionId: string) => void;
    stopGeneration: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Abort Controller for stopping generation
    const abortControllerRef = useRef<AbortController | null>(null);
    const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Initial Load - Fetch from Backend
    useEffect(() => {
        const token = localStorage.getItem("ag_token");
        if (!token) return;

        const fetchHistory = async () => {
            try {
                const res = await fetch("http://localhost:8080/history", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    // Map backend sessions to frontend structure (if needed)
                    // The backend returns {id, title, ...}. Messages are not loaded by default list.
                    // We might need to fetch messages when selecting a session.
                    setSessions(data.map((s: any) => ({
                        id: s.id,
                        title: s.title,
                        messages: [], // Initially empty, load on select
                        timestamp: new Date(s.CreatedAt).getTime()
                    })));
                }
            } catch (e) {
                console.error("Failed to load history", e);
            }
        };
        fetchHistory();
    }, []);

    // Load messages when selecting a session
    useEffect(() => {
        if (!currentSessionId) return;

        const session = sessions.find(s => s.id === currentSessionId);
        // If messages are empty (and it's not a brand new local session), fetch them
        if (session && session.messages.length === 0 && session.id.length > 10) { // Check if valid UUID not temp
            const fetchMessages = async () => {
                const token = localStorage.getItem("ag_token");
                const res = await fetch(`http://localhost:8080/session/${currentSessionId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setSessions(prev => prev.map(s => {
                        if (s.id === currentSessionId) {
                            return {
                                ...s,
                                messages: data.messages.map((m: any) => ({
                                    id: m.id,
                                    role: m.role,
                                    content: m.content,
                                    timestamp: new Date(m.CreatedAt).getTime()
                                }))
                            };
                        }
                        return s;
                    }));
                }
            }
            fetchMessages();
        }
    }, [currentSessionId]);

    const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

    const createNewSession = () => {
        setCurrentSessionId(null);
    };

    const selectSession = (sessionId: string) => {
        setCurrentSessionId(sessionId);
    };

    const deleteSession = async (sessionId: string) => {
        const token = localStorage.getItem("ag_token");
        await fetch(`http://localhost:8080/session/${sessionId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
        }
    };

    const stopGeneration = () => {
        // Abort the fetch request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        // Clear the typing interval
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
        }
        setLoading(false);
    };

    const sendMessage = async (content: string) => {
        const token = localStorage.getItem("ag_token");
        if (!token) {
            // Redirect to login if needed, or handle error
            console.error("No auth token");
            return;
        }

        let activeSessionId = currentSessionId;

        // Optimistic UI for new chat
        if (!activeSessionId) {
            // We don't have a real ID yet. We can start a temporary one
            // or just rely on backend to return one (but we need to stream).
            // Strategy: Assume we are creating a new one.
            // Backend creates session if sessionId is empty.
        }

        // Add User Message Optimistically
        const userMsg: Message = {
            id: uuidv4(),
            role: 'user',
            content,
            timestamp: Date.now()
        };

        // If 'activeSessionId' is null, it means we are in "New Chat" mode.
        // We create a temp session in UI to show the message immediately.
        if (!activeSessionId) {
            const tempId = uuidv4();
            const newSession: ChatSession = {
                id: tempId,
                title: content.substring(0, 30) + "...",
                messages: [userMsg],
                timestamp: Date.now()
            };
            setSessions(prev => [newSession, ...prev]);
            activeSessionId = tempId;
            setCurrentSessionId(tempId);
        } else {
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return { ...s, messages: [...s.messages, userMsg] };
                }
                return s;
            }));
        }

        setLoading(true);

        // Create new AbortController for this request
        abortControllerRef.current = new AbortController();

        try {
            // Create placeholder AI message
            const aiMsgId = uuidv4();
            const initialAiMsg: Message = {
                id: aiMsgId,
                role: 'ai',
                content: "",
                timestamp: Date.now()
            };

            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return { ...s, messages: [...s.messages, initialAiMsg] };
                }
                return s;
            }));

            // Prepare History (exclude the just added message for backend context if needed, 
            // but actually we usually include full history. The backend expects previous history.)
            // The backend Append mechanism will add the new message.
            const currentSession = sessions.find(s => s.id === activeSessionId);
            const history = currentSession?.messages.map(m => ({
                role: m.role,
                content: m.content
            })) || [];

            // If it's a temp ID (client generated), don't send it to backend as "sessionId".
            // Send empty string so backend creates a new one.
            // Wait, if it *is* a temp ID, we need to update it with the Real ID from backend later?
            // This is complex with streaming.
            // Simplification: Be okay with UI having a temp ID until refresh for now. 
            // BUT: If the user sends a *second* message, we need the real ID.
            // Problem: Streaming response doesn't return the SessionID in headers easily unless we parse it.
            // Fix: We'll stick to not sending SessionID for the *first* message. 
            // AND we assume for this session the UI keeps using the TempID? No, that breaks persistence on second msg.

            // Allow backend to handle "sessionId" as optional.
            // Ideally, the first chunk or headers should contain the new SessionID.
            // For now, let's just make it work. The user will likely refresh or we can silently fetch history after.

            const payloadSessionId = (activeSessionId && activeSessionId.length > 10 && !activeSessionId.includes("-")) ? activeSessionId : "";
            // UUIDs have dashes. Our temp UUID has dashes. Postgres UUID has dashes. 
            // Determining if it's "real" or "temp" is hard if both are UUIDs.
            // Let's assume if it is newly created in this function call (was null), it's new.

            // Actually, we can just send the UUID. If backend doesn't find it, it creates new?
            // No, backend expects existing ID.
            // Let's pass empty string if it's the very first message of a "New Chat".
            const isNewChat = sessions.find(s => s.id === activeSessionId)?.messages.length === 1; // Only user msg

            const res = await fetch("http://localhost:8080/chat/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    sessionId: isNewChat ? "" : activeSessionId, // Send empty if new
                    message: content,
                    history: history
                }),
                signal: abortControllerRef.current?.signal, // Connect abort signal
            });

            if (!res.ok) throw new Error(res.statusText);

            // Check for Session ID update
            const realSessionId = res.headers.get("X-Session-ID");
            if (realSessionId && realSessionId !== activeSessionId) {
                // Update local state with real ID
                setSessions(prev => prev.map(s => {
                    if (s.id === activeSessionId) {
                        return { ...s, id: realSessionId }; // Swap ID
                    }
                    return s;
                }));
                setCurrentSessionId(realSessionId);
                activeSessionId = realSessionId; // Update ref for streaming loop
            }

            if (!res.body) throw new Error("No response body");

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            // SMOOTH TYPING LOGIC
            // 1. We accumulate raw data in a buffer
            let streamBuffer = "";
            let isStreamDone = false;

            // 2. We set up an interval to "type" characters from the buffer to the UI
            // This runs independently of the network speed
            const TYPING_SPEED_MS = 15; // Fast but readable (adjust as needed)

            const typingInterval = setInterval(() => {
                if (streamBuffer.length > 0) {
                    // Take a chunk of characters (1-3 chars for natural variance)
                    const charCount = Math.floor(Math.random() * 3) + 1;
                    const chunk = streamBuffer.substring(0, charCount);
                    streamBuffer = streamBuffer.substring(charCount);

                    setSessions(prev => prev.map(s => {
                        if (s.id === activeSessionId) {
                            return {
                                ...s,
                                messages: s.messages.map(m =>
                                    m.id === aiMsgId ? { ...m, content: m.content + chunk } : m
                                )
                            };
                        }
                        return s;
                    }));
                } else if (isStreamDone) {
                    // Buffer is empty AND network is done -> stop typing
                    clearInterval(typingInterval);
                    typingIntervalRef.current = null;
                    setLoading(false); // Only stop loading when typing is complete
                }
            }, TYPING_SPEED_MS);

            // Store ref for potential cancellation
            typingIntervalRef.current = typingInterval;

            // 3. Network Reader Loop
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    isStreamDone = true;
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                // Push to buffer, don't update state directly here
                streamBuffer += chunk;
            }

        } catch (e: any) {
            // Check if this was an intentional abort (user clicked Stop)
            if (e.name === 'AbortError' || e.message?.includes('aborted')) {
                // Silently ignore - user intentionally stopped generation
                return;
            }

            const errorMsg: Message = {
                id: uuidv4(),
                role: 'ai',
                content: "Error: " + e.message,
                timestamp: Date.now()
            };
            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return { ...s, messages: [...s.messages, errorMsg] };
                }
                return s;
            }));
        } finally {
            // Note: setLoading(false) is now called in the typing interval when complete
            // This ensures stop button stays visible while typing animation continues
            abortControllerRef.current = null;
        }
    };

    return (
        <ChatContext.Provider value={{
            sessions,
            currentSessionId,
            currentMessages,
            loading,
            createNewSession,
            selectSession,
            sendMessage,
            deleteSession,
            stopGeneration
        }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChat() {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within a ChatProvider");
    return context;
}
