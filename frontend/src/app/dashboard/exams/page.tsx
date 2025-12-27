"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen,
    Clock,
    GraduationCap,
    Play,
    CheckCircle2,
    ChevronRight,
    ArrowLeft,
    Award,
    Scroll
} from "lucide-react";

interface Subject {
    id: string;
    name: string;
    code: string;
    level: string; // "Foundation", "Diploma", "BSc", "BS"
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

const CATEGORIES = [
    {
        id: "Foundation",
        title: "Foundation Level",
        description: "Start your journey with fundamental concepts.",
        icon: BookOpen,
        gradient: "from-cyan-500 to-blue-600",
        bg: "bg-gradient-to-br"
    },
    {
        id: "Diploma",
        title: "Diploma Level",
        description: "Advance to specialized technical skills.",
        icon: GraduationCap,
        gradient: "from-purple-500 to-pink-600",
        bg: "bg-gradient-to-br"
    },
    {
        id: "BSc",
        title: "BSc Degree",
        description: "Deep dive into theoretical mastery.",
        icon: Award,
        gradient: "from-orange-500 to-red-600",
        bg: "bg-gradient-to-br"
    },
    {
        id: "BS",
        title: "BS Degree",
        description: "The pinnacle of academic excellence.",
        icon: Scroll,
        gradient: "from-emerald-500 to-teal-600",
        bg: "bg-gradient-to-br"
    }
];

export default function ExamsPage() {
    const router = useRouter();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [papers, setPapers] = useState<TermPaper[]>([]);
    const [selectedPapers, setSelectedPapers] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // New State for Category Selection
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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

    // Filter Papers based on Selected Category AND other filters
    const filteredPapers = papers.filter(paper => {
        const subject = subjects.find(s => s.id === paper.subject_id);

        // Critical: Filter by Category first
        if (selectedCategory && subject?.level !== selectedCategory) return false;

        if (filterTerm !== "all" && paper.term !== filterTerm) return false;
        return true;
    });

    const uniqueTerms = [...new Set(papers.map(p => p.term))];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#171717] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#171717] text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-4 mb-2">
                        {selectedCategory && (
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="w-6 h-6 text-zinc-400" />
                            </button>
                        )}
                        <h1 className="text-4xl font-bold flex items-center gap-3">
                            <GraduationCap className="w-10 h-10 text-cyan-400" />
                            Exam Hall
                        </h1>
                    </div>
                    <p className="text-zinc-400 text-lg max-w-2xl">
                        {selectedCategory
                            ? `Select subjects from ${selectedCategory} Level to start your practice exam.`
                            : "Choose your academic level to access relevant exam papers."}
                    </p>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!selectedCategory ? (
                        /* --- Category Selection View --- */
                        <motion.div
                            key="categories"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {CATEGORIES.map((cat, idx) => (
                                <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="group relative cursor-pointer"
                                >
                                    <div className={`absolute inset-0 ${cat.bg} ${cat.gradient} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 rounded-2xl`} />
                                    <div className="relative h-full bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-zinc-700 transition-all group-hover:-translate-y-1 duration-300">
                                        <div className={`w-14 h-14 rounded-xl ${cat.bg} ${cat.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                                            <cat.icon className="w-7 h-7 text-white" />
                                        </div>
                                        <h3 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">{cat.title}</h3>
                                        <p className="text-zinc-500 text-sm leading-relaxed">{cat.description}</p>

                                        <div className="mt-6 flex items-center text-sm font-medium text-zinc-400 group-hover:text-white transition-colors">
                                            Select Level <ChevronRight className="w-4 h-4 ml-1" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : (
                        /* --- Subject Selection View --- */
                        <motion.div
                            key="subjects"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            {/* Secondary Filters */}
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex gap-4">
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
                                <div className="text-zinc-500 text-sm">
                                    Showing papers for <span className="text-cyan-400 font-bold">{selectedCategory}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Paper Selection Grid */}
                                <div className="lg:col-span-2 space-y-4">
                                    {filteredPapers.length === 0 ? (
                                        <div className="text-center py-20 text-zinc-500 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
                                            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No exam papers found for {selectedCategory}.</p>
                                            <p className="text-sm mt-2">Try adjusting filters or check back later.</p>
                                        </div>
                                    ) : (
                                        filteredPapers.map((paper, index) => {
                                            const isSelected = selectedPapers.includes(paper.id);
                                            const subject = subjects.find(s => s.id === paper.subject_id);

                                            return (
                                                <motion.div
                                                    key={paper.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => togglePaper(paper.id)}
                                                    className={`
                                                        p-5 rounded-xl cursor-pointer transition-all border group
                                                        ${isSelected
                                                            ? "bg-cyan-500/10 border-cyan-500/50"
                                                            : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900"
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors
                                                                    ${isSelected ? "bg-cyan-500 border-cyan-500" : "border-zinc-700 group-hover:border-zinc-500"}
                                                                `}>
                                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                                                </div>
                                                                <div>
                                                                    <h3 className="font-bold text-lg text-zinc-100">
                                                                        {subject?.name || paper.name}
                                                                    </h3>
                                                                    <div className="flex items-center gap-3 mt-1.5 text-xs text-zinc-500 font-medium uppercase tracking-wide">
                                                                        <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">{paper.exam_type}</span>
                                                                        <span>•</span>
                                                                        <span>{paper.term}</span>
                                                                        <span>•</span>
                                                                        <span>{subject?.code}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="flex items-center gap-6 mt-4 ml-10 text-sm text-zinc-400">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock className="w-4 h-4 text-zinc-500" />
                                                                    {paper.duration_minutes} min
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <Award className="w-4 h-4 text-zinc-500" />
                                                                    {paper.total_marks} marks
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <ChevronRight className={`w-5 h-5 text-zinc-600 transition-transform duration-300 ${isSelected ? "rotate-90 text-cyan-400" : "group-hover:text-zinc-400"}`} />
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Selection Summary */}
                                <div className="lg:col-span-1">
                                    <div className="sticky top-8 bg-zinc-900/80 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800 shadow-xl">
                                        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-cyan-400" />
                                            Exam Session
                                        </h2>

                                        {selectedPapers.length === 0 ? (
                                            <div className="text-center py-8">
                                                <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <BookOpen className="w-6 h-6 text-zinc-600" />
                                                </div>
                                                <p className="text-zinc-400 text-sm">
                                                    Select subjects from the list to build your exam session.
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="space-y-4 mb-8">
                                                    <div className="flex justify-between text-sm py-2 border-b border-zinc-800/50">
                                                        <span className="text-zinc-400">Selected Papers</span>
                                                        <span className="font-bold text-white">{selectedPapers.length}</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm py-2 border-b border-zinc-800/50">
                                                        <span className="text-zinc-400">Total Duration</span>
                                                        <span className="font-bold text-white">{totalDuration} mins</span>
                                                    </div>
                                                    <div className="flex justify-between text-sm py-2 border-b border-zinc-800/50">
                                                        <span className="text-zinc-400">Total Marks</span>
                                                        <span className="font-bold text-white">{totalMarks}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={startExam}
                                                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl font-bold text-white shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-3 transition-all transform active:scale-95"
                                                >
                                                    <Play className="w-5 h-5 fill-current" />
                                                    Start Session Now
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
