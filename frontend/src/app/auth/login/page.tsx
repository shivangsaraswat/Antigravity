"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BrainCircuit, Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Form State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("http://localhost:8080/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Login failed");
            }

            // Save Token
            localStorage.setItem("ag_token", data.token);
            localStorage.setItem("ag_user", JSON.stringify(data.user));

            // Redirect
            router.push("/dashboard");

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md space-y-8"
            >
                {/* Logo */}
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4">
                        <BrainCircuit className="w-6 h-6 text-black" />
                    </div>
                    <h2 className="text-3xl font-medium tracking-tight">Welcome back</h2>
                    <p className="text-zinc-400 mt-2">Sign in to your Orbit account</p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-4 bg-zinc-900/40 p-6 rounded-2xl border border-white/5">

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm text-zinc-400 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white text-black font-medium h-12 rounded-xl hover:bg-zinc-200 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
                        </button>
                    </div>
                </form>

                <div className="text-center text-sm text-zinc-500">
                    Don't have an account?{" "}
                    <Link href="/auth/signup" className="text-white hover:underline underline-offset-4">
                        Create one
                    </Link>
                </div>

            </motion.div>
        </div>
    );
}
