"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    GraduationCap,
    Code2,
    MessageSquare,
    Settings,
    LogOut,
    BrainCircuit,
    Plus,
    Search,
    MessageSquareDashed,
    Trash2,
    LayoutGrid,
    FolderOpen,
    Book
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

const apps = [
    { href: "/dashboard", label: "Orbit", icon: BrainCircuit },
    { href: "/dashboard/exams", label: "Exam Hall", icon: GraduationCap },
    { href: "/dashboard/sandbox", label: "Sandbox", icon: Code2 },
    { href: "/dashboard/forum", label: "Community", icon: MessageSquare },
    { href: "/dashboard/resources", label: "PYQs & Resources", icon: Book },
];

export function Sidebar() {
    const pathname = usePathname();
    const { sessions, currentSessionId, createNewSession, selectSession, deleteSession } = useChat();

    return (
        <aside className="hidden md:flex flex-col w-[260px] h-screen sticky top-0 bg-[#000000] z-50 transition-all duration-300 border-r border-white/10">

            {/* Top Actions */}
            <div className="p-3 pb-0 space-y-2">
                <Button
                    onClick={createNewSession}
                    className="w-full justify-start gap-3 bg-transparent hover:bg-zinc-900 text-white border-0 rounded-lg h-11 px-3 shadow-none font-normal text-[14px] transition-colors"
                >
                    <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                        <Plus className="w-4 h-4" />
                    </div>
                    <span>New chat</span>
                    <span className="ml-auto opacity-50"><Plus className="w-4 h-4" /></span>
                </Button>

                {/* Search Placeholder - Visual only for now */}
                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 px-3 h-10 font-normal text-[14px]"
                >
                    <Search className="w-4 h-4" />
                    <span>Search chats</span>
                </Button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col pt-4">

                {/* Apps Section */}
                <div className="px-3 pb-4">
                    <div className="px-3 mb-2">
                        <span className="text-xs font-medium text-zinc-400">Apps</span>
                    </div>
                    <nav className="space-y-0.5">
                        {apps.map((item) => {
                            const Icon = item.icon;
                            // Active state logic: minimal 'selected' background 
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group text-[14px]",
                                        isActive
                                            ? "bg-zinc-900 text-white font-medium shadow-sm"
                                            : "text-zinc-100 hover:bg-zinc-900 hover:text-white"
                                    )}
                                >
                                    <Icon className={cn("w-4 h-4 text-zinc-100 group-hover:text-white transition-colors")} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>


                {/* Chat History Section */}
                <div className="px-3 flex-1 flex flex-col overflow-hidden">
                    <div className="px-3 mb-2 flex items-center justify-between group">
                        <span className="text-xs font-medium text-zinc-400">Your chats</span>
                    </div>

                    <ScrollArea className="flex-1 -mx-2 px-2">
                        <div className="space-y-0.5 pb-2">
                            {sessions.length === 0 ? (
                                <div className="px-3 py-6 text-center text-slate-600 text-xs">
                                    No recent chats
                                </div>
                            ) : (
                                sessions.map((session) => (
                                    <div
                                        key={session.id}
                                        className={cn(
                                            "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-[14px]",
                                            currentSessionId === session.id
                                                ? "bg-zinc-900 text-white font-medium shadow-sm"
                                                : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                                        )}
                                        onClick={() => selectSession(session.id)}
                                    >
                                        <span className="flex-1 truncate pr-6">
                                            {session.title.charAt(0).toUpperCase() + session.title.slice(1)}
                                        </span>

                                        {/* Hover Actions */}
                                        <div className={cn(
                                            "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1",
                                            "opacity-0 group-hover:opacity-100 transition-opacity",
                                            currentSessionId === session.id ? "bg-zinc-900" : "bg-[#000000] group-hover:bg-zinc-900"
                                        )}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteSession(session.id);
                                                }}
                                                className="p-1 hover:text-white text-slate-400 transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Footer Profile */}
            <div className="p-3 border-t border-white/5 bg-[#000000]">
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-900 transition-colors text-left group">
                    <Avatar className="w-8 h-8 rounded-sm">
                        <AvatarImage src="https://github.com/shadcn.png" />
                        <AvatarFallback className="rounded-sm bg-purple-600 text-white">S</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">Shivang</p>
                        <p className="text-xs text-slate-500">Free Plan</p>
                    </div>
                    <Settings className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                </button>
            </div>
        </aside>
    );
}
