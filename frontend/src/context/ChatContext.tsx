"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        const saved = localStorage.getItem("ag_chat_history");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSessions(parsed);
                // Optionally select the most recent one? Or start empty.
            } catch (e) {
                console.error("Failed to load chat history", e);
            }
        }
    }, []);

    // Save on Change
    useEffect(() => {
        localStorage.setItem("ag_chat_history", JSON.stringify(sessions));
    }, [sessions]);

    const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

    const createNewSession = () => {
        const newSession: ChatSession = {
            id: uuidv4(),
            title: "New Chat",
            messages: [],
            timestamp: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
    };

    const selectSession = (sessionId: string) => {
        setCurrentSessionId(sessionId);
    };

    const deleteSession = (sessionId: string) => {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
            setCurrentSessionId(null);
        }
    };

    const sendMessage = async (content: string) => {
        let activeSessionId = currentSessionId;

        // If no session exists, create one immediately
        if (!activeSessionId) {
            const newSession: ChatSession = {
                id: uuidv4(),
                title: content.substring(0, 30) + (content.length > 30 ? "..." : ""),
                messages: [],
                timestamp: Date.now()
            };
            // logic to add session immediately locally
            setSessions(prev => [newSession, ...prev]);
            activeSessionId = newSession.id;
            setCurrentSessionId(activeSessionId);
        }

        const userMsg: Message = {
            id: uuidv4(),
            role: 'user',
            content,
            timestamp: Date.now()
        };

        // UI Update (Optimistic)
        setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
                return {
                    ...s,
                    messages: [...s.messages, userMsg],
                    // Update title if it's "New Chat" and this is first message
                    title: s.messages.length === 0 ? (content.substring(0, 30) + "...") : s.title
                };
            }
            return s;
        }));

        setLoading(true);

        try {
            const res = await fetch("http://localhost:8080/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: content }),
            });

            if (!res.ok) throw new Error(res.statusText);

            const data = await res.json();

            const aiMsg: Message = {
                id: uuidv4(),
                role: 'ai',
                content: data.response || "No response.",
                sources: data.sources,
                timestamp: Date.now()
            };

            setSessions(prev => prev.map(s => {
                if (s.id === activeSessionId) {
                    return { ...s, messages: [...s.messages, aiMsg] };
                }
                return s;
            }));

        } catch (e: any) {
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
            setLoading(false);
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
            deleteSession
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
