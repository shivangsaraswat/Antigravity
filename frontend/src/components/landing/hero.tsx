"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { ContainerTextFlip } from "@/components/ui/container-text-flip";

const World = dynamic(() => import("@/components/ui/globe").then((m) => m.World), {
    ssr: false,
});

export function Hero() {
    const globeConfig = {
        pointSize: 4,
        globeColor: "#062056",
        showAtmosphere: true,
        atmosphereColor: "#FFFFFF",
        atmosphereAltitude: 0.1,
        emissive: "#062056",
        emissiveIntensity: 0.1,
        shininess: 0.9,
        polygonColor: "rgba(255,255,255,0.7)",
        ambientLight: "#38bdf8",
        directionalLeftLight: "#ffffff",
        directionalTopLight: "#ffffff",
        pointLight: "#ffffff",
        arcTime: 1000,
        arcLength: 0.9,
        rings: 1,
        maxRings: 3,
        initialPosition: { lat: 22.3193, lng: 114.1694 },
        autoRotate: true,
        autoRotateSpeed: 0.5,
    };
    const colors = ["#06b6d4", "#3b82f6", "#6366f1"];
    const sampleArcs = [
        {
            order: 1,
            startLat: -19.885592,
            startLng: -43.951191,
            endLat: -22.9068,
            endLng: -43.1729,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 1,
            startLat: 28.6139,
            startLng: 77.209,
            endLat: 3.139,
            endLng: 101.6869,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 1,
            startLat: -19.885592,
            startLng: -43.951191,
            endLat: -1.303396,
            endLng: 36.852443,
            arcAlt: 0.5,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 2,
            startLat: 1.3521,
            startLng: 103.8198,
            endLat: 35.6762,
            endLng: 139.6503,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 2,
            startLat: 51.5072,
            startLng: -0.1276,
            endLat: 3.139,
            endLng: 101.6869,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 2,
            startLat: -15.785493,
            startLng: -47.909029,
            endLat: 36.162809,
            endLng: -115.119411,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 3,
            startLat: -33.8688,
            startLng: 151.2093,
            endLat: 22.3193,
            endLng: 114.1694,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 3,
            startLat: 21.3099,
            startLng: -157.8581,
            endLat: 40.7128,
            endLng: -74.006,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 3,
            startLat: -6.2088,
            startLng: 106.8456,
            endLat: 51.5072,
            endLng: -0.1276,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 4,
            startLat: 11.986597,
            startLng: 8.571831,
            endLat: -15.595412,
            endLng: -56.05918,
            arcAlt: 0.5,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 4,
            startLat: -34.6037,
            startLng: -58.3816,
            endLat: 22.3193,
            endLng: 114.1694,
            arcAlt: 0.7,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 4,
            startLat: 51.5072,
            startLng: -0.1276,
            endLat: 48.8566,
            endLng: -2.3522,
            arcAlt: 0.1,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 5,
            startLat: 14.5995,
            startLng: 120.9842,
            endLat: 51.5072,
            endLng: -0.1276,
            arcAlt: 0.3,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 5,
            startLat: 1.3521,
            startLng: 103.8198,
            endLat: -33.8688,
            endLng: 151.2093,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
        {
            order: 5,
            startLat: 34.0522,
            startLng: -118.2437,
            endLat: 48.8566,
            endLng: -2.3522,
            arcAlt: 0.2,
            color: colors[Math.floor(Math.random() * (colors.length - 1))],
        },
    ];

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-black to-black -z-20" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 -z-20" />

            {/* GLOBE INTEGRATION */}
            <div className="absolute top-[40%] left-0 right-0 h-[1400px] w-full z-0 opacity-80 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10" />
                <World globeConfig={globeConfig} data={sampleArcs} />
            </div>

            {/* Animated Spotlight/Beam */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-indigo-500/20 blur-[100px] rounded-[50%] pointer-events-none -z-10" />

            <div className="max-w-5xl mx-auto text-center space-y-8 z-10 relative">
                <div className="grid grid-cols-1 md:grid-cols-2 items-center justify-center gap-4 w-full max-w-[90vw]">
                    <motion.h1
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 text-center md:text-right pb-8 leading-tight"
                    >
                        Intelligence,
                    </motion.h1>
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="flex justify-center md:justify-start"
                    >
                        <ContainerTextFlip
                            words={["Unbound", "Limitless", "Antigravity", "Infinite"]}
                            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter bg-transparent shadow-none p-0 !m-0 leading-tight"
                            textClassName="text-white"
                        />
                    </motion.div>
                </div>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed"
                >
                    Step into <span className="text-white font-medium">Orbit</span>. The academic ecosystem powered by <span className="text-indigo-400 font-medium">Antigravity</span>.
                    Experience context-aware mentorship, real-time sandboxes, and predictive analytics.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
                >
                    <Link href="/dashboard">
                        <Button size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-slate-200 transition-all font-medium text-base shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]">
                            Initialize Orbit
                            <Sparkles className="w-4 h-4 ml-2 fill-black" />
                        </Button>
                    </Link>
                    <Link href="#">
                        <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-white/10 text-white hover:bg-white/5 hover:text-white transition-all font-medium text-base bg-black/50 backdrop-blur-md">
                            Read Manifesto
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Code Snippet / Visual - KEEPING IT, BUT MOVING Z-INDEX TO BE ON TOP OF GLOBE */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                className="mt-20 relative w-full max-w-4xl mx-auto z-10"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl opacity-20 blur-lg" />
                <div className="relative bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="ml-4 text-xs font-mono text-slate-500">
                            orbit_core — zsh — 80x24
                        </div>
                    </div>
                    <div className="p-6 font-mono text-sm md:text-base overflow-x-auto">
                        <div className="space-y-1">
                            <p className="text-slate-400">
                                <span className="text-green-400">➜</span> <span className="text-blue-400">~</span> <span className="text-yellow-100">orbit init --mode=student</span>
                            </p>
                            <p className="text-slate-500 pl-4 pb-2">Initializing environment...</p>
                            <p className="text-slate-300 pl-4">
                                <span className="text-green-500">✓</span> Cognitive Module Loaded <span className="text-slate-600 text-xs">[12ms]</span>
                            </p>
                            <p className="text-slate-300 pl-4">
                                <span className="text-green-500">✓</span> Sandbox Environment Ready <span className="text-slate-600 text-xs">[45ms]</span>
                            </p>
                            <p className="text-slate-300 pl-4 pb-2">
                                <span className="text-green-500">✓</span> <span className="text-purple-400">Antigravity AI</span> Connected
                            </p>
                            <p className="text-slate-400 pt-2">
                                <span className="text-green-400">➜</span> <span className="text-blue-400">~</span> <span className="animate-pulse">_</span>
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}
