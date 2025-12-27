"use client";

import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = {
    basic: ["Access to Spirit AI (Limited)", "Basic Sandbox usage", "Community access", "1 Exam simulation/week"],
    pro: ["Unlimited Spirit AI", "Advanced Sandbox (Unlimited)", "Priority Support", "Unlimited Exam simulations", "Personalized Roadmap", "Cheat Detection API"],
    team: ["Everything in Pro", "Team Dashboard", "Instructor controls", "API Access", "Custom Integrations"],
};

export function Pricing() {
    return (
        <section className="py-24 px-4 bg-black border-t border-white/5">
            <div className="max-w-7xl mx-auto">

                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white">
                        Transparent, <span className="text-indigo-400">Generous</span> Pricing.
                    </h2>
                    <p className="text-slate-400 text-lg">
                        Start for free, upgrade when you're ready to dominate.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* FREE TIER */}
                    <div className="rounded-3xl p-8 bg-[#0a0a0a] border border-white/10 flex flex-col hover:border-white/20 transition-colors">
                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-slate-300">Starter</h3>
                            <div className="mt-4 flex items-baseline text-white">
                                <span className="text-4xl font-bold tracking-tight">$0</span>
                                <span className="ml-1 text-xl font-semibold text-slate-500">/mo</span>
                            </div>
                            <p className="mt-4 text-slate-400 text-sm">Perfect for curious minds just starting out.</p>
                        </div>
                        <div className="flex-1 space-y-4 mb-8">
                            {features.basic.map((feat) => (
                                <div key={feat} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                    <span className="text-slate-300 text-sm">{feat}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full rounded-full border-white/10 hover:bg-white/5 hover:text-white h-12">
                            Get Started
                        </Button>
                    </div>


                    {/* PRO TIER (Highlighted) */}
                    <div className="rounded-3xl p-8 bg-[#101010] border border-indigo-500/30 flex flex-col relative shadow-[0_0_40px_rgba(99,102,241,0.1)] scale-105 z-10">
                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                        <div className="mb-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-indigo-400">Scholar</h3>
                                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">
                                    MOST POPULAR
                                </span>
                            </div>
                            <div className="mt-4 flex items-baseline text-white">
                                <span className="text-4xl font-bold tracking-tight">$19</span>
                                <span className="ml-1 text-xl font-semibold text-slate-500">/mo</span>
                            </div>
                            <p className="mt-4 text-slate-400 text-sm">Full power for serious academic performance.</p>
                        </div>
                        <div className="flex-1 space-y-4 mb-8">
                            {features.pro.map((feat) => (
                                <div key={feat} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-indigo-400" />
                                    </div>
                                    <span className="text-white text-sm">{feat}</span>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full rounded-full bg-white text-black hover:bg-slate-200 h-12 font-medium">
                            Upgrade to Scholar
                        </Button>
                    </div>


                    {/* TEAM TIER */}
                    <div className="rounded-3xl p-8 bg-[#0a0a0a] border border-white/10 flex flex-col hover:border-white/20 transition-colors">
                        <div className="mb-8">
                            <h3 className="text-lg font-medium text-slate-300">Institution</h3>
                            <div className="mt-4 flex items-baseline text-white">
                                <span className="text-4xl font-bold tracking-tight">$99</span>
                                <span className="ml-1 text-xl font-semibold text-slate-500">/mo</span>
                            </div>
                            <p className="mt-4 text-slate-400 text-sm">For research labs and classrooms.</p>
                        </div>
                        <div className="flex-1 space-y-4 mb-8">
                            {features.team.map((feat) => (
                                <div key={feat} className="flex items-center gap-3">
                                    <Check className="w-5 h-5 text-slate-500 flex-shrink-0" />
                                    <span className="text-slate-300 text-sm">{feat}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="outline" className="w-full rounded-full border-white/10 hover:bg-white/5 hover:text-white h-12">
                            Contact Sales
                        </Button>
                    </div>

                </div>
            </div>
        </section>
    );
}
