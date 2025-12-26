import { Sidebar } from "@/components/dashboard/sidebar";
import { ChatProvider } from "@/context/ChatContext";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
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
