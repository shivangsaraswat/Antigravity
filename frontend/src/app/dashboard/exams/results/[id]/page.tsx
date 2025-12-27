"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Trophy,
    CheckCircle,
    XCircle,
    Clock,
    ArrowLeft,
    BarChart3,
    MessageSquare
} from "lucide-react";
import Link from "next/link";

interface Score {
    correct: number;
    total: number;
    percentage: number;
}

interface AttemptResult {
    id: string;
    status: string;
    started_at: string;
    submitted_at: string;
    total_duration_mins: number;
    scores: { [paperId: string]: Score };
}

export default function ResultsPage() {
    const router = useRouter();
    const params = useParams();
    const attemptId = params.id as string;

    const [result, setResult] = useState<AttemptResult | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        const token = localStorage.getItem("ag_token");
        if (!token) {
            router.push("/auth/login");
            return;
        }

        try {
            const res = await fetch(`http://localhost:8080/exam/attempt/${attemptId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Parse scores if string
                if (typeof data.scores === "string") {
                    data.scores = JSON.parse(data.scores);
                }
                setResult(data);
            }
        } catch (e) {
            console.error("Failed to fetch results", e);
        } finally {
            setLoading(false);
        }
    };

    const calculateOverall = () => {
        if (!result?.scores) return { correct: 0, total: 0, percentage: 0 };

        const scores = Object.values(result.scores);
        const correct = scores.reduce((sum, s) => sum + s.correct, 0);
        const total = scores.reduce((sum, s) => sum + s.total, 0);
        const percentage = total > 0 ? (correct / total) * 100 : 0;

        return { correct, total, percentage };
    };

    const overall = calculateOverall();

    const getGrade = (percentage: number) => {
        if (percentage >= 90) return { grade: "A+", color: "text-green-400" };
        if (percentage >= 80) return { grade: "A", color: "text-green-500" };
        if (percentage >= 70) return { grade: "B+", color: "text-blue-400" };
        if (percentage >= 60) return { grade: "B", color: "text-blue-500" };
        if (percentage >= 50) return { grade: "C", color: "text-yellow-500" };
        if (percentage >= 40) return { grade: "D", color: "text-orange-500" };
        return { grade: "F", color: "text-red-500" };
    };

    const { grade, color } = getGrade(overall.percentage);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#171717] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!result) {
        return (
            <div className="min-h-screen bg-[#171717] flex items-center justify-center text-white">
                <p>Results not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#171717] text-white p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <Link
                    href="/dashboard/exams"
                    className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-8"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Exam Hall
                </Link>

                {/* Score Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-8 mb-8 border border-zinc-700"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-2xl font-semibold flex items-center gap-3">
                                <Trophy className="w-7 h-7 text-yellow-500" />
                                Exam Results
                            </h1>
                            <p className="text-zinc-400 mt-1">
                                Submitted: {new Date(result.submitted_at || "").toLocaleString()}
                            </p>
                        </div>
                        <div className={`text-6xl font-bold ${color}`}>
                            {grade}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 text-center">
                        <div className="bg-zinc-800/50 rounded-xl p-6">
                            <p className="text-4xl font-bold text-green-400">
                                {overall.correct.toFixed(1)}
                            </p>
                            <p className="text-zinc-400 mt-2">Marks Obtained</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-xl p-6">
                            <p className="text-4xl font-bold text-zinc-300">
                                {overall.total}
                            </p>
                            <p className="text-zinc-400 mt-2">Total Marks</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-xl p-6">
                            <p className="text-4xl font-bold text-cyan-400">
                                {overall.percentage.toFixed(1)}%
                            </p>
                            <p className="text-zinc-400 mt-2">Percentage</p>
                        </div>
                    </div>
                </motion.div>

                {/* Subject-wise Breakdown */}
                {result.scores && Object.keys(result.scores).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-zinc-900/50 rounded-2xl p-6 border border-zinc-800 mb-8"
                    >
                        <h2 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-cyan-400" />
                            Subject-wise Analysis
                        </h2>

                        <div className="space-y-4">
                            {Object.entries(result.scores).map(([paperId, score], index) => (
                                <div key={paperId} className="bg-zinc-800/50 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">Paper {index + 1}</span>
                                        <span className={`font-bold ${score.percentage >= 60 ? "text-green-400" :
                                                score.percentage >= 40 ? "text-yellow-400" : "text-red-400"
                                            }`}>
                                            {score.percentage.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-zinc-700 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${score.percentage >= 60 ? "bg-green-500" :
                                                    score.percentage >= 40 ? "bg-yellow-500" : "bg-red-500"
                                                }`}
                                            style={{ width: `${score.percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm text-zinc-400 mt-2">
                                        <span>{score.correct.toFixed(1)} / {score.total} marks</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 gap-4"
                >
                    <Link
                        href="/dashboard/exams"
                        className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-center transition-colors"
                    >
                        Take Another Exam
                    </Link>
                    <Link
                        href="/dashboard"
                        className="p-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 rounded-xl text-center transition-opacity flex items-center justify-center gap-2"
                    >
                        <MessageSquare className="w-5 h-5" />
                        Discuss with Spirit
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
