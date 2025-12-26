"use client";

import { motion } from "framer-motion";
import { Cpu, Database, Network, Share2, Workflow, ArrowRight, Zap } from "lucide-react";

export function LearningEngine() {
    return (
        <section className="py-32 bg-black relative overflow-hidden flex flex-col items-center">

            {/* Background Diagram Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

            <div className="max-w-7xl w-full px-6 relative z-10">

                <div className="mb-20 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-white/5 border border-white/10 text-xs font-mono text-slate-400 tracking-wider uppercase mb-4">
                        <Cpu className="w-3 h-3" />
                        <span>System Architecture v2.0</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                        Industrial-Grade <span className="text-indigo-500">Cognitive Engine</span>
                    </h2>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        We don't just "guess". Orbit deconstructs your syllabus into a semantic knowledge graph, running millions of simulations to predict your next optimization.
                    </p>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-0 items-center justify-center relative">

                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-slate-800 -z-10 -translate-y-1/2">
                        <motion.div
                            className="h-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent w-1/3 blur-sm"
                            animate={{ x: ["-100%", "300%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    {/* STEP 1: INPUT */}
                    <div className="flex flex-col items-center text-center space-y-6 group">
                        <div className="w-24 h-24 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center relative shadow-2xl z-10 group-hover:border-indigo-500/50 transition-colors">
                            <Database className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                            {/* Data Particles */}
                            <div className="absolute -right-4 top-1/2 w-8 h-[1px] bg-indigo-500/50 hidden md:block" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white font-mono">Ingest</h3>
                            <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                                Syllabus, past papers, and personal notes are vectorized.
                            </p>
                        </div>
                    </div>

                    {/* STEP 2: PROCESSING (CENTER) */}
                    <div className="flex flex-col items-center text-center space-y-6 relative">
                        <div className="w-32 h-32 rounded-full bg-[#050505] border border-indigo-500/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(99,102,241,0.2)] z-20">
                            <div className="absolute inset-0 rounded-full border border-indigo-500/10 border-dashed animate-[spin_10s_linear_infinite]" />
                            <Network className="w-12 h-12 text-indigo-400" />

                            {/* Pulse Effect */}
                            <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white font-mono">Process</h3>
                            <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                                Semantic analysis identifies gaps and predicts exam probabilities.
                            </p>
                        </div>
                    </div>


                    {/* STEP 3: OUTPUT */}
                    <div className="flex flex-col items-center text-center space-y-6 group">
                        <div className="w-24 h-24 rounded-2xl bg-[#0a0a0a] border border-white/10 flex items-center justify-center relative shadow-2xl z-10 group-hover:border-green-500/50 transition-colors">
                            <Zap className="w-8 h-8 text-slate-400 group-hover:text-green-400 transition-colors" />
                            {/* Data Particles */}
                            <div className="absolute -left-4 top-1/2 w-8 h-[1px] bg-green-500/50 hidden md:block" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-white font-mono">Execute</h3>
                            <p className="text-sm text-slate-500 max-w-[200px] mx-auto">
                                Actionable study plans and real-time coding environments generated.
                            </p>
                        </div>
                    </div>

                </div>

                {/* Technical Terminal Footer */}
                <div className="mt-24 max-w-4xl mx-auto border border-white/5 bg-white/[0.02] rounded-lg p-6 font-mono text-xs md:text-sm text-slate-400">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                        <span className="text-slate-500">orbit_kernel.log</span>
                        <div className="flex gap-2">
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p><span className="text-blue-500">INFO</span> [14:02:22] Initializing semantic vector store...</p>
                        <p><span className="text-blue-500">INFO</span> [14:02:23] <span className="text-slate-300">140,200 nodes</span> indexed successfully.</p>
                        <p><span className="text-yellow-500">WARN</span> [14:02:24] Optimization opportunity detected in 'Calculus III'.</p>
                        <p><span className="text-green-500">SUCCESS</span> [14:02:25] Study efficiency projected to increase by <span className="text-green-400">+34%</span>.</p>
                    </div>
                </div>

            </div>
        </section>
    );
}
