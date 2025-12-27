"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    BookOpen,
    Clock,
    GraduationCap,
    Play,
    CheckCircle2,
    ChevronRight,
    Filter
} from "lucide-react";

interface Subject {
    id: string;
    name: string;
    code: string;
    level: string;
}

interface TermPaper {
    id: string;
    subject_id: string;
    name: string;
    term: string;
    exam_type: string;
    duration_minutes: number;
    total_marks: number;
    total_questions: number;
    subject?: Subject;
}

export default function ExamsPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [papers, setPapers] = useState<TermPaper[]>([]);
    const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterTerm, setFilterTerm] = useState<string>("all");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const token = localStorage.getItem("ag_token");
        if (!token) {
            router.push("/auth/login");
            return;
        }

        try {
            const [subjectsRes, papersRes] = await Promise.all([
                fetch("http://localhost:8080/exam/subjects", {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch("http://localhost:8080/exam/papers", {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (subjectsRes.ok) {
                setSubjects(await subjectsRes.json() || []);
            }
            if (papersRes.ok) {
                setPapers(await papersRes.json() || []);
            }
        } catch (e) {
            console.error("Failed to fetch exam data", e);
        } finally {
            setLoading(false);
        }
    };

    const togglePaper = (paperId: string) => {
        setSelectedPapers(prev =>
            prev.includes(paperId)
                ? prev.filter(id => id !== paperId)
                : [...prev, paperId]
        );
    };

    const totalDuration = selectedPapers.length * 60; // 60 min per paper
    const totalMarks = selectedPapers.reduce((sum, id) => {
        const paper = papers.find(p => p.id === id);
        return sum + (paper?.total_marks || 50);
    }, 0);

    const startExam = async () => {
        if (selectedPapers.length === 0) return;

        const token = localStorage.getItem("ag_token");
        try {
            const res = await fetch("http://localhost:8080/exam/start", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ paper_ids: selectedPapers })
            });

            if (res.ok) {
                const attempt = await res.json();
                router.push(`/exam/live/${attempt.id}`);
            }
        } catch (e) {
            console.error("Failed to start exam", e);
        }
    };

    const filteredPapers = papers.filter(paper => {
        const subject = subjects.find(s => s.id === paper.subject_id);
        if (filterLevel !== "all" && subject?.level !== filterLevel) return false;
        if (filterTerm !== "all" && paper.term !== filterTerm) return false;
        return true;
    });

    const uniqueTerms = [...new Set(papers.map(p => p.term))];
    const uniqueLevels = [...new Set(subjects.map(s => s.level))];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#171717] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#171717] text-white p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-semibold flex items-center gap-3">
                        <GraduationCap className="w-8 h-8 text-cyan-400" />
                        Exam Hall
                    </h1>
                    <p className="text-zinc-400 mt-2">
                        Select subjects to take a practice exam. Each subject is 60 minutes.
                    </p>
                </motion.div>

                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <select
                        value={filterLevel}
                        onChange={(e) => setFilterLevel(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="all">All Levels</option>
                        {uniqueLevels.map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>

                    <select
                        value={filterTerm}
                        onChange={(e) => setFilterTerm(e.target.value)}
                        className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <option value="all">All Terms</option>
                        {uniqueTerms.map(term => (
                            <option key={term} value={term}>{term}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Paper Selection Grid */}
                    <div className="lg:col-span-2 space-y-4">
                        {filteredPapers.length === 0 ? (
                            <div className="text-center py-20 text-zinc-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No exam papers available yet.</p>
                                <p className="text-sm mt-2">Upload PDFs using the parser to add exams.</p>
                            </div>
                        ) : (
                            filteredPapers.map((paper, index) => {
                                const isSelected = selectedPapers.includes(paper.id);
                                const subject = subjects.find(s => s.id === paper.subject_id);

                                return (
                                    <motion.div
                                        key={paper.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => togglePaper(paper.id)}
                                        className={`
                                            p-5 rounded-xl cursor-pointer transition-all border
                                            ${isSelected
                                                ? "bg-cyan-500/10 border-cyan-500/50"
                                                : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center
                                                        ${isSelected ? "bg-cyan-500 border-cyan-500" : "border-zinc-600"}
                                                    `}>
                                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                    </div>
                                                    <h3 className="font-medium">
                                                        {subject?.name || paper.name}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-4 mt-3 text-sm text-zinc-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {paper.duration_minutes} min
                                                    </span>
                                                    <span>{paper.total_marks} marks</span>
                                                    <span className="px-2 py-0.5 bg-zinc-800 rounded text-xs">
                                                        {paper.exam_type}
                                                    </span>
                                                    <span className="text-zinc-500">{paper.term}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>

                    {/* Selection Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
                            <h2 className="text-lg font-medium mb-4">Exam Summary</h2>

                            {selectedPapers.length === 0 ? (
                                <p className="text-zinc-500 text-sm">
                                    Select at least one subject to start.
                                </p>
                            ) : (
                                <>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Subjects</span>
                                            <span className="font-medium">{selectedPapers.length}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Total Duration</span>
                                            <span className="font-medium">{totalDuration} minutes</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Total Marks</span>
                                            <span className="font-medium">{totalMarks}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-zinc-800 pt-4 mb-6">
                                        <p className="text-xs text-zinc-500 mb-4">
                                            Selected: {selectedPapers.map(id => {
                                                const paper = papers.find(p => p.id === id);
                                                const subject = subjects.find(s => s.id === paper?.subject_id);
                                                return subject?.code || paper?.name;
                                            }).join(", ")}
                                        </p>
                                    </div>

                                    <button
                                        onClick={startExam}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                    >
                                        <Play className="w-5 h-5" />
                                        Start Exam
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
