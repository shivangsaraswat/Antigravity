"use client";

import { motion } from "framer-motion";
import { BrainCircuit, GraduationCap, Code2, Users, ArrowUpRight, Cpu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BentoGrid() {
    return (
        <section className="py-24 px-4 bg-black relative overflow-hidden">
            {/* Subtle Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                        Powered by <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">Antigravity</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Explore the modules that make Orbit the most advanced learning ecosystem.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">

                    {/* 1. Large Main Card: ANTIGRAVITY CORE (Spans 2x2) */}
                    <motion.div
                        whileHover={{ scale: 1.01 }}
                        className="md:col-span-2 md:row-span-2 rounded-3xl bg-[#0a0a0a] border border-white/10 p-8 relative overflow-hidden group"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-600/20 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div className="space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/5">
                                    <BrainCircuit className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Antigravity Engine</h3>
                                <p className="text-slate-400 leading-relaxed max-w-[90%]">
                                    The neural core of Orbit. It understands your syllabus, predicts key topics, and adapts to your learning style in real-time.
                                </p>
                            </div>

                            {/* Visual Representation of AI */}
                            <div className="w-full h-48 bg-black/50 rounded-xl border border-white/5 mt-8 relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                                <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
                                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                                    <div className="h-1 flex-1 bg-indigo-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[60%] animate-[width_2s_ease-in-out_infinite]" />
                                    </div>
                                    <div className="h-1 flex-1 bg-purple-500/20 rounded-full overflow-hidden">
                                        <div className="h-full bg-purple-500 w-[80%] animate-[width_3s_ease-in-out_infinite]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>


                    {/* 2. Wide Top Card: EXAM HALL */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="md:col-span-2 rounded-3xl bg-[#0e0e0e] border border-white/10 p-6 relative overflow-hidden group flex flex-col md:flex-row items-center gap-6"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowUpRight className="text-white/50 w-6 h-6" />
                        </div>

                        <div className="flex-1 space-y-2 text-center md:text-left z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium mb-2 border border-blue-500/20">
                                <GraduationCap className="w-3 h-3" />
                                <span>Exam Hall</span>
                            </div>
                            <h3 className="text-xl font-bold text-white">Stress Test Yourself</h3>
                            <p className="text-slate-400 text-sm">Real-world exam simulations with AI grading.</p>
                        </div>

                        <div className="w-full md:w-1/2 h-32 rounded-lg bg-[#151515] border border-white/5 relative p-4 group-hover:border-blue-500/30 transition-colors">
                            <div className="space-y-2">
                                <div className="w-3/4 h-2 bg-slate-700/50 rounded-full" />
                                <div className="w-1/2 h-2 bg-slate-700/50 rounded-full" />
                                <div className="w-full h-1 bg-slate-800/50 rounded-full mt-4" />
                                <div className="w-full h-1 bg-slate-800/50 rounded-full" />
                            </div>
                            <div className="absolute bottom-3 right-3 text-2xl font-bold text-blue-400">A+</div>
                        </div>
                    </motion.div>


                    {/* 3. Small Box: SANDBOX */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="md:col-span-1 rounded-3xl bg-[#0a0a0a] border border-white/10 p-6 relative overflow-hidden group flex flex-col justify-between"
                    >
                        <div className="space-y-3 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 mb-2">
                                <Code2 className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Sandbox</h3>
                            <p className="text-slate-500 text-xs">Run code instantly.</p>
                        </div>
                        <div className="mt-4 p-3 rounded-lg bg-black border border-white/10 font-mono text-[10px] text-slate-300 opacity-60 group-hover:opacity-100 transition-opacity">
                            <span className="text-purple-400">def</span> solve():<br />
                            &nbsp;&nbsp;return <span className="text-yellow-400">True</span>
                        </div>
                    </motion.div>


                    {/* 4. Small Box: COMMUNITY */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="md:col-span-1 rounded-3xl bg-[#0a0a0a] border border-white/10 p-6 relative overflow-hidden group flex flex-col justify-between"
                    >
                        <div className="space-y-3 relative z-10">
                            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 mb-2">
                                <Users className="w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Community</h3>
                            <p className="text-slate-500 text-xs">Peer-to-peer learning.</p>
                        </div>

                        <div className="mt-4 flex -space-x-2 overflow-hidden px-1">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-[#0a0a0a] flex items-center justify-center text-[10px] text-white">
                                    U{i}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                </div>
            </div>
        </section>
    );
}
