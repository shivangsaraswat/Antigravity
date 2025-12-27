"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
    Book,
    PanelLeft
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

import { OrbitLogo } from "@/components/ui/orbit-logo";

// ... existing apps array ...
const apps = [
    { href: "/dashboard", label: "Spirit", icon: BrainCircuit },
    { href: "/dashboard/exams", label: "Exam Hall", icon: GraduationCap },
    { href: "/dashboard/sandbox", label: "Sandbox", icon: Code2 },
    { href: "/dashboard/forum", label: "Community", icon: MessageSquare },
    { href: "/dashboard/resources", label: "PYQs & Resources", icon: Book },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { sessions, currentSessionId, createNewSession, selectSession, deleteSession } = useChat();
    const [user, setUser] = useState<{ name: string, email: string } | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const stored = localStorage.getItem("ag_user");
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("ag_token");
        localStorage.removeItem("ag_user");
        router.push("/auth/login");
    };

    const filteredSessions = sessions.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <aside
                className={cn(
                    "hidden md:flex flex-col h-screen sticky top-0 bg-[#212121] z-50 transition-all duration-300 border-r border-white/5",
                    isCollapsed ? "w-[60px]" : "w-[260px]"
                )}
                style={{ fontFamily: '"Söhne", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
            >

                {/* Header: Logo & Collapse */}
                <div className={cn("flex items-center p-3", isCollapsed ? "justify-center" : "justify-between")}>
                    {!isCollapsed && (
                        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#2f2f2f] transition-colors cursor-pointer group">
                            <div className="w-12 h-12 flex items-center justify-center shrink-0">
                                <OrbitLogo />
                            </div>
                            <span className="font-medium text-sm text-[#ececec]">Orbit</span>
                        </div>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="text-zinc-400 hover:text-white hover:bg-[#2f2f2f] h-9 w-9"
                        title={isCollapsed ? "Expand sidebar" : "Close sidebar"}
                    >
                        <PanelLeft className="w-5 h-5" />
                    </Button>
                </div>

                {/* Top Actions: New Chat & Search */}
                <div className="px-3 space-y-1 mb-3">
                    <button
                        onClick={createNewSession}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                            "hover:bg-[#2f2f2f]"
                        )}
                        title="New chat"
                    >
                        <div className={cn("flex items-center justify-center shrink-0", isCollapsed ? "mx-auto" : "")}>
                            <Plus className="w-5 h-5" style={{ color: '#ececec' }} />
                        </div>
                        {!isCollapsed && (
                            <span className="text-[14px] font-normal truncate" style={{ color: '#ececec' }}>New chat</span>
                        )}
                    </button>

                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                            "hover:bg-[#2f2f2f]"
                        )}
                        title="Search chats"
                    >
                        <div className={cn("flex items-center justify-center shrink-0", isCollapsed ? "mx-auto" : "")}>
                            <Search className="w-4 h-4" style={{ color: '#ececec' }} />
                        </div>
                        {!isCollapsed && (
                            <span className="text-[14px] font-normal truncate" style={{ color: '#ececec' }}>Search chats</span>
                        )}
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Apps Section */}
                    <div className="px-3 pb-4">
                        {!isCollapsed && (
                            <div className="px-3 mb-2">
                                <span className="text-xs font-medium" style={{ color: '#b4b4b4' }}>Apps</span>
                            </div>
                        )}
                        <nav className="space-y-0.5">
                            {apps.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group text-[14px]",
                                            isActive
                                                ? "bg-[#2f2f2f] font-medium shadow-sm"
                                                : "hover:bg-[#2f2f2f]",
                                            isCollapsed ? "justify-center px-2" : ""
                                        )}
                                        style={{ color: isActive ? '#ffffff' : '#ececec', fontWeight: 450 }}
                                        title={item.label}
                                    >
                                        <Icon className="w-4 h-4 shrink-0" style={{ color: '#ececec' }} />
                                        {!isCollapsed && <span>{item.label}</span>}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Chat History Section (Hidden when collapsed) */}
                    {!isCollapsed && (
                        <div className="flex-1 flex flex-col overflow-hidden px-3">
                            <div className="px-3 mb-2 flex items-center justify-between group">
                                <span className="text-xs font-medium" style={{ color: '#b4b4b4' }}>Your chats</span>
                            </div>

                            <div className="flex-1 overflow-y-auto scrollbar-none">
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
                                                        ? "bg-[#2f2f2f] font-medium shadow-sm"
                                                        : "hover:bg-[#2f2f2f]"
                                                )}
                                                style={{ color: currentSessionId === session.id ? '#ffffff' : '#ececec', fontWeight: 450 }}
                                                onClick={() => selectSession(session.id)}
                                            >
                                                <span className="flex-1 truncate pr-6">
                                                    {session.title.charAt(0).toUpperCase() + session.title.slice(1)}
                                                </span>

                                                <div className={cn(
                                                    "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1",
                                                    "opacity-0 group-hover:opacity-100 transition-opacity",
                                                    currentSessionId === session.id ? "bg-[#2f2f2f]" : "bg-[#212121] group-hover:bg-[#2f2f2f]"
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
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Profile */}
                <div className="p-3 border-t border-white/5 bg-[#212121]">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className={cn(
                                "w-full flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-zinc-900 transition-colors text-left group focus:outline-none",
                                isCollapsed ? "justify-center" : ""
                            )}>
                                <Avatar className="w-8 h-8 rounded-sm shrink-0">
                                    <AvatarImage src="https://github.com/shadcn.png" />
                                    <AvatarFallback className="rounded-sm bg-purple-600 text-white">
                                        {user?.name?.[0] || "U"}
                                    </AvatarFallback>
                                </Avatar>
                                {!isCollapsed && (
                                    <>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {user?.name || "Guest User"}
                                            </p>
                                            <p className="text-xs text-slate-500">Free Plan</p>
                                        </div>
                                        <Settings className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                                    </>
                                )}
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-zinc-950 border-white/10 text-white" align="end" side={isCollapsed ? "right" : "top"} forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user?.name || "Guest"}</p>
                                    <p className="text-xs leading-none text-zinc-400">{user?.email || "guest@example.com"}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem className="cursor-pointer focus:bg-zinc-900 focus:text-white">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-500/10">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Log out</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            {/* Search Dialog */}
            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogContent className="sm:max-w-[450px] bg-[#212121] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                    <DialogHeader className="sr-only">
                        <DialogTitle>Search chats</DialogTitle>
                    </DialogHeader>

                    <div className="p-4 border-b border-white/10 flex items-center gap-3">
                        <Search className="w-5 h-5 text-zinc-400" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search chats..."
                            className="bg-transparent border-0 focus-visible:ring-0 text-white placeholder:text-zinc-500 text-base h-auto p-0"
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="h-[300px] p-2">
                        {filteredSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-sm gap-2">
                                <Search className="w-8 h-8 opacity-50" />
                                <span>No chats found</span>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <div className="px-2 py-1.5 text-xs font-medium text-zinc-500">Results</div>
                                {filteredSessions.map((session) => (
                                    <button
                                        key={session.id}
                                        onClick={() => {
                                            selectSession(session.id);
                                            setIsSearchOpen(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#2f2f2f] transition-colors text-left group"
                                    >
                                        <MessageSquareDashed className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-zinc-200 group-hover:text-white truncate">
                                                {session.title || "Untitled Chat"}
                                            </div>
                                            <div className="text-xs text-zinc-500 truncate">
                                                {session.id}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </>
    );
}
