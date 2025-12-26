"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { ChatProvider } from "@/context/ChatContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("ag_token");
        if (!token) {
            router.push("/auth/login");
        } else {
            setIsAuthorized(true);
        }
    }, [router]);

    if (!isAuthorized) {
        return null; // Or a loading spinner
    }

    return (
        <ChatProvider>
            <div className="min-h-screen bg-[#09090b] text-white flex">
                <Sidebar />
                <main className="flex-1 relative z-10 overflow-y-auto h-screen">
                    {children}
                </main>
            </div>
        </ChatProvider>
    );
}
