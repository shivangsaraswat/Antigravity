"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Plus, Mic, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CommandInputProps {
    onSend: (message: string) => void;
    loading: boolean;
    isCentered?: boolean;
}

export function CommandInput({ onSend, loading, isCentered = true }: CommandInputProps) {
    const [query, setQuery] = useState("");
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        if (!query.trim()) return;
        onSend(query);
        setQuery("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Auto-focus input
    useEffect(() => {
        if (!loading && inputRef.current) {
            inputRef.current.focus();
        }
    }, [loading]);

    return (
        <div className={cn(
            "relative flex flex-col w-full transition-all duration-300",
            isCentered ? "shadow-none" : "shadow-lg"
        )}>
            <div className="relative overflow-hidden rounded-[28px] bg-[#1e1f20] flex flex-col transition-all duration-300 group">

                <textarea
                    ref={inputRef}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        // adjustHeight(); // This function is not defined in the original context, so commenting out or removing.
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={loading}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Ask anything..."
                    className="appearance-none border-none bg-transparent text-lg placeholder:text-zinc-500 h-16 focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:outline-none focus:border-none ring-0 shadow-none outline-none text-white min-w-0 flex-1 px-6 pt-4 font-normal resize-none"
                    style={{ minHeight: "64px" }}
                />

                <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                            <Plus className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                            <ImageIcon className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-1">
                        {query.trim() || loading ? (
                            <Button
                                onClick={handleSend}
                                disabled={!query.trim() || loading}
                                size="icon"
                                className={cn(
                                    "w-10 h-10 rounded-full transition-all duration-200",
                                    query.trim()
                                        ? "bg-white text-black hover:bg-zinc-200"
                                        : "bg-transparent text-zinc-500 cursor-not-allowed"
                                )}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
                            </Button>
                        ) : (
                            <Button variant="ghost" size="icon" className="w-10 h-10 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors">
                                <Mic className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
