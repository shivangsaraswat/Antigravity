"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, GraduationCap, Code2, MessageSquare, Book, BrainCircuit } from "lucide-react";
import { CommandInput } from "@/components/dashboard/command-input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useChat } from "@/context/ChatContext";

export default function DashboardPage() {
    const { currentMessages, loading, sendMessage } = useChat();
    const hasStarted = currentMessages.length > 0;

    const chatsEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [isAtBottom, setIsAtBottom] = useState(true);

    // Scroll Handler to detect if user is at bottom
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        // Check if user is near bottom (within 100px)
        const isBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsAtBottom(isBottom);
    };

    // Auto-scroll Effect
    useEffect(() => {
        if (hasStarted && isAtBottom) {
            // Use 'auto' instead of 'smooth' to eliminate jitter during active typing
            chatsEndRef.current?.scrollIntoView({ behavior: loading ? "auto" : "smooth" });
        }
    }, [currentMessages, loading, hasStarted, isAtBottom]);

    const suggestions = [
        "Create a study plan for Calculus",
        "Explain Quantum Mechanics simply",
        "Give me a difficult coding problem",
        "Summarize my last test results"
    ];

    const services = [
        { icon: GraduationCap, label: "Exam Hall", color: "text-blue-400", bg: "bg-blue-400/10" },
        { icon: Code2, label: "Sandbox", color: "text-purple-400", bg: "bg-purple-400/10" },
        { icon: MessageSquare, label: "Community", color: "text-green-400", bg: "bg-green-400/10" },
        { icon: Book, label: "Resources", color: "text-orange-400", bg: "bg-orange-400/10" },
    ];

    const handleSend = async (msg: string) => {
        setIsAtBottom(true); // Always snap to bottom when sending new message
        await sendMessage(msg);
    }

    return (
        <div className="relative min-h-screen bg-[#171717] text-[#f5f5f5] font-sans selection:bg-cyan-500/30 selection:text-cyan-200 flex flex-col">

            {/* Scrollable Content Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 w-full scrollbar-none pb-40"
            >
                <div className={cn(
                    "max-w-4xl mx-auto w-full transition-all duration-700 ease-in-out min-h-full flex flex-col",
                    hasStarted ? "justify-start pt-10" : "justify-start pt-[15vh] items-center"
                )}>

                    <AnimatePresence mode="wait">
                        {!hasStarted ? (
                            /* START SCREEN */
                            <motion.div
                                key="hero"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, display: "none" }}
                                transition={{ duration: 0.3 }}
                                className="w-full flex flex-col items-center pb-20"
                            >
                                {/* Centered Greeting & Input Area */}
                                <div className="flex flex-col items-center w-full max-w-3xl space-y-10">

                                    <div className="space-y-1 text-left w-full pl-2">
                                        <h2 className="text-4xl md:text-5xl font-medium tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 w-fit pb-2 leading-tight">
                                            Hello, Shivang
                                        </h2>
                                        <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-[#444746]">
                                            How can I help you today?
                                        </h1>
                                    </div>

                                    <div className="w-full relative z-20">
                                        <CommandInput
                                            onSend={handleSend}
                                            loading={loading}
                                            isCentered={true}
                                        />
                                        <p className="text-center text-xs md:text-sm text-zinc-500 mt-4 font-medium">
                                            Antigravity can make mistakes. Check important info.
                                        </p>
                                    </div>

                                </div>

                                {/* Service Shortcuts - Bento Grid (Scrollable Below) */}
                                <div className="w-full max-w-3xl mt-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                                        {/* Large Card: Exam Hall */}
                                        <Link href="/dashboard/exams" className="md:col-span-2 relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-8 hover:bg-zinc-900/80 hover:border-white/10 transition-all group text-left h-full">
                                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <GraduationCap className="w-32 h-32" />
                                            </div>
                                            <div className="relative z-10 flex flex-col h-full justify-between">
                                                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-400">
                                                    <GraduationCap className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-medium text-white mb-2">Exam Hall</h3>
                                                    <p className="text-base text-zinc-400">Take practice tests and evaluate your progress.</p>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Tall Card: Sandbox */}
                                        <Link href="/dashboard/sandbox" className="md:row-span-2 relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/5 p-8 hover:bg-zinc-900/80 hover:border-white/10 transition-all group text-left flex flex-col justify-end min-h-[240px]">
                                            <div className="absolute top-6 right-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                                <Code2 className="w-24 h-24" />
                                            </div>
                                            <div className="relative z-10 mt-auto">
                                                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-400">
                                                    <Code2 className="w-7 h-7" />
                                                </div>
                                                <h3 className="text-2xl font-medium text-white mb-2">Sandbox</h3>
                                                <p className="text-base text-zinc-400">Code in real-time.</p>
                                            </div>
                                        </Link>

                                        {/* Small Card: Community */}
                                        <Link href="/dashboard/forum" className="rounded-3xl bg-zinc-900/40 border border-white/5 p-8 hover:bg-zinc-900/80 hover:border-white/10 transition-all group text-left">
                                            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4 text-green-400">
                                                <MessageSquare className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-medium text-white">Community</h3>
                                        </Link>

                                        {/* Small Card: Resources */}
                                        <Link href="/dashboard/resources" className="rounded-3xl bg-zinc-900/40 border border-white/5 p-8 hover:bg-zinc-900/80 hover:border-white/10 transition-all group text-left">
                                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-400">
                                                <Book className="w-6 h-6" />
                                            </div>
                                            <h3 className="text-xl font-medium text-white">Resources</h3>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            /* CHAT VIEW */
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full space-y-8 pb-10"
                            >
                                {currentMessages.map((msg, idx) => {
                                    const isLast = idx === currentMessages.length - 1;
                                    const isThinking = isLast && msg.role === 'ai' && loading;

                                    return (
                                        <div
                                            key={msg.id}
                                            className={cn("flex gap-4 w-full", msg.role === 'user' ? "justify-end" : "justify-start")}
                                        >
                                            {msg.role === 'ai' && (
                                                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center shrink-0 mt-1 bg-black text-white">
                                                    {isThinking ? (
                                                        <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                                                    ) : (
                                                        <BrainCircuit className="w-5 h-5" />
                                                    )}
                                                </div>
                                            )}

                                            <div className={cn(
                                                "max-w-[100%] space-y-1",
                                                msg.role === 'user' ? "bg-[#2f2f2f] px-5 py-3.5 rounded-[20px] rounded-br-md" : "pl-0 pr-4"
                                            )}>
                                                <div className="prose prose-invert prose-p:leading-8 prose-headings:font-semibold prose-headings:text-gray-100 prose-headings:mt-6 prose-headings:mb-3 prose-p:text-[16px] prose-li:text-[16px] prose-p:text-gray-200 prose-strong:text-white prose-pre:bg-[#0d0d0d] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-ul:my-4 prose-li:my-1.5 max-w-none text-[#ececec]">
                                                    {msg.role === 'ai' ? (
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {msg.content}
                                                        </ReactMarkdown>
                                                    ) : (
                                                        <p className="whitespace-pre-wrap m-0 text-[16px] leading-7">{msg.content}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatsEndRef} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Fixed Input Bar Layer (Only shown when chat started) */}
            <AnimatePresence>
                {hasStarted && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed left-0 md:left-[260px] right-0 bottom-0 bg-gradient-to-t from-[#09090b] via-[#09090b] to-transparent pb-8 pt-10 z-[60] flex justify-center pointer-events-none"
                    >
                        <div className="w-full px-4 max-w-3xl pointer-events-auto">
                            <CommandInput
                                onSend={handleSend}
                                loading={loading}
                                isCentered={false}
                            />
                            <p className="text-center text-[11px] text-zinc-500 mt-3">
                                Antigravity can make mistakes. Check important info.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
