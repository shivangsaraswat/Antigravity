"use client";

import Link from "next/link";
import { BrainCircuit, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function Navbar() {
    return (
        <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 backdrop-blur-md border-b border-white/5 bg-black/50"
        >
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                    <BrainCircuit className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold tracking-tight text-white mb-0.5">Orbit</span>
            </div>

            <nav className="hidden md:flex items-center gap-8">
                {["Features", "Solutions", "Docs", "Pricing"].map((item) => (
                    <Link
                        key={item}
                        href="#"
                        className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
                    >
                        {item}
                    </Link>
                ))}
            </nav>

            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="hidden md:block text-sm font-medium text-slate-300 hover:text-white transition-colors">
                    Log in
                </Link>
                <Link href="/dashboard">
                    <Button className="rounded-full bg-white text-black hover:bg-slate-200 transition-colors font-medium h-9 px-5 gap-1.5 group">
                        Launch Console
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                </Link>
            </div>
        </motion.header>
    );
}
