"use client";

import { motion } from "framer-motion";
import { Book, FileText, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ResourcesPage() {
    return (
        <div className="flex flex-col h-full bg-black text-white p-6 md:p-8 overflow-y-auto">

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-400">
                        <Book className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-medium tracking-tight">PYQs & Resources</h1>
                        <p className="text-zinc-400">Access past year papers and study materials.</p>
                    </div>
                </div>
            </motion.div>

            {/* Filters / Controls */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-8"
            >
                <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter by Subject
                </Button>
                <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                    Latest Uploads
                </Button>
            </motion.div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Example Resource Card 1 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="group relative p-6 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 transition-all cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <Button size="icon" variant="ghost" className="text-zinc-500 group-hover:text-white">
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                    <h3 className="text-xl font-medium mb-1">Mathematics 2023</h3>
                    <p className="text-zinc-400 text-sm mb-4">Final Semester • Set A</p>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-400">PDF</span>
                        <span className="px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-400">2.4 MB</span>
                    </div>
                </motion.div>

                {/* Example Resource Card 2 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="group relative p-6 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 transition-all cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <Button size="icon" variant="ghost" className="text-zinc-500 group-hover:text-white">
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                    <h3 className="text-xl font-medium mb-1">Physics Finals</h3>
                    <p className="text-zinc-400 text-sm mb-4">2022 • Comprehensive</p>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-400">PDF</span>
                        <span className="px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-400">1.8 MB</span>
                    </div>
                </motion.div>

                {/* Example Resource Card 3 */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="group relative p-6 rounded-3xl bg-zinc-900/40 border border-white/5 hover:border-white/10 hover:bg-zinc-900/60 transition-all cursor-pointer"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                            <FileText className="w-6 h-6" />
                        </div>
                        <Button size="icon" variant="ghost" className="text-zinc-500 group-hover:text-white">
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                    <h3 className="text-xl font-medium mb-1">Computer Science</h3>
                    <p className="text-zinc-400 text-sm mb-4">Data Structures • Notes</p>
                    <div className="flex gap-2">
                        <span className="px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-400">DOCX</span>
                        <span className="px-2 py-1 rounded-md bg-zinc-800 text-xs text-zinc-400">500 KB</span>
                    </div>
                </motion.div>
            </div>

        </div>
    );
}
