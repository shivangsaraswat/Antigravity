"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
    Clock,
    ChevronLeft,
    ChevronRight,
    Flag,
    Square,
    CheckCircle,
    AlertCircle,
    Eye,
    Send
} from "lucide-react";

interface Option {
    id: string;
    text: string;
    is_correct?: boolean;
}

interface Question {
    id: string;
    question_number: number;
    question_type: string;
    question_text: string;
    question_image?: string;
    options: Option[];
    marks: number;
    section?: string;
}

interface Paper {
    id: string;
    name: string;
    subject?: { name: string };
    questions: Question[];
}

type QuestionStatus = "NOT_VISITED" | "ANSWERED" | "NOT_ANSWERED" | "MARKED" | "ANSWERED_MARKED";

interface Response {
    answer: string | string[] | number | null;
    status: QuestionStatus;
    time_spent: number;
}

export default function LiveExamPage() {
    const router = useRouter();
    const params = useParams();
    const attemptId = params.id as string;

    const [papers, setPapers] = useState<Paper[]>([]);
    const [currentPaperIndex, setCurrentPaperIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [responses, setResponses] = useState<Map<string, Response>>(new Map());
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const questionStartTime = useRef<number>(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentPaper = papers[currentPaperIndex];
    const allQuestions = papers.flatMap(p => p.questions);
    const currentQuestion = allQuestions[currentQuestionIndex];

    useEffect(() => {
        fetchExamData();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        // Start timer countdown
        timerRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    // Time's up! Auto-submit
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const fetchExamData = async () => {
        const token = localStorage.getItem("ag_token");
        if (!token) {
            router.push("/auth/login");
            return;
        }

        try {
            // Get attempt details
            const attemptRes = await fetch(`http://localhost:8080/exam/attempt/${attemptId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!attemptRes.ok) {
                router.push("/dashboard/exams");
                return;
            }

            const attempt = await attemptRes.json();
            setTimeRemaining(attempt.time_remaining_secs);

            // Load saved responses
            if (attempt.responses) {
                const savedResponses = new Map<string, Response>();
                Object.entries(attempt.responses).forEach(([qId, resp]: [string, any]) => {
                    savedResponses.set(qId, resp);
                });
                setResponses(savedResponses);
            }

            // Get papers with questions
            const paperIDs = JSON.parse(attempt.paper_ids || "[]");
            const papersData: Paper[] = [];

            for (const paperId of paperIDs) {
                const paperRes = await fetch(`http://localhost:8080/exam/papers/${paperId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (paperRes.ok) {
                    papersData.push(await paperRes.json());
                }
            }

            setPapers(papersData);
        } catch (e) {
            console.error("Failed to fetch exam", e);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const saveResponse = useCallback(async (questionId: string, response: Response) => {
        const token = localStorage.getItem("ag_token");
        try {
            await fetch(`http://localhost:8080/exam/attempt/${attemptId}/response`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    question_id: questionId,
                    answer: response.answer,
                    status: response.status,
                    time_spent: response.time_spent
                })
            });
        } catch (e) {
            console.error("Failed to save response", e);
        }
    }, [attemptId]);

    const handleAnswer = (answer: string | string[] | number) => {
        if (!currentQuestion) return;

        const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
        const existing = responses.get(currentQuestion.id);

        const newResponse: Response = {
            answer,
            status: existing?.status === "MARKED" ? "ANSWERED_MARKED" : "ANSWERED",
            time_spent: (existing?.time_spent || 0) + timeSpent
        };

        setResponses(prev => new Map(prev).set(currentQuestion.id, newResponse));
        saveResponse(currentQuestion.id, newResponse);
        questionStartTime.current = Date.now();
    };

    const handleMark = () => {
        if (!currentQuestion) return;

        const existing = responses.get(currentQuestion.id);
        const currentStatus = existing?.status || "NOT_VISITED";

        let newStatus: QuestionStatus;
        if (currentStatus === "ANSWERED") newStatus = "ANSWERED_MARKED";
        else if (currentStatus === "ANSWERED_MARKED") newStatus = "ANSWERED";
        else if (currentStatus === "MARKED") newStatus = "NOT_ANSWERED";
        else newStatus = "MARKED";

        const newResponse: Response = {
            answer: existing?.answer || null,
            status: newStatus,
            time_spent: existing?.time_spent || 0
        };

        setResponses(prev => new Map(prev).set(currentQuestion.id, newResponse));
        saveResponse(currentQuestion.id, newResponse);
    };

    const handleClear = () => {
        if (!currentQuestion) return;

        const existing = responses.get(currentQuestion.id);
        const newResponse: Response = {
            answer: null,
            status: existing?.status?.includes("MARKED") ? "MARKED" : "NOT_ANSWERED",
            time_spent: existing?.time_spent || 0
        };

        setResponses(prev => new Map(prev).set(currentQuestion.id, newResponse));
        saveResponse(currentQuestion.id, newResponse);
    };

    const navigateQuestion = (index: number) => {
        if (index < 0 || index >= allQuestions.length) return;

        // Mark current as visited if not answered
        if (currentQuestion && !responses.has(currentQuestion.id)) {
            const timeSpent = Math.floor((Date.now() - questionStartTime.current) / 1000);
            const newResponse: Response = {
                answer: null,
                status: "NOT_ANSWERED",
                time_spent: timeSpent
            };
            setResponses(prev => new Map(prev).set(currentQuestion.id, newResponse));
            saveResponse(currentQuestion.id, newResponse);
        }

        setCurrentQuestionIndex(index);
        questionStartTime.current = Date.now();
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);

        const token = localStorage.getItem("ag_token");
        try {
            const res = await fetch(`http://localhost:8080/exam/attempt/${attemptId}/submit`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                router.push(`/dashboard/exams/results/${attemptId}`);
            }
        } catch (e) {
            console.error("Failed to submit", e);
            setSubmitting(false);
        }
    };

    const getStatusColor = (status: QuestionStatus | undefined) => {
        switch (status) {
            case "ANSWERED": return "bg-green-500";
            case "NOT_ANSWERED": return "bg-red-500";
            case "MARKED": return "bg-purple-500";
            case "ANSWERED_MARKED": return "bg-purple-500 ring-2 ring-green-400";
            default: return "bg-zinc-700";
        }
    };

    const getStatusCount = (status: QuestionStatus) => {
        return allQuestions.filter(q => responses.get(q.id)?.status === status).length;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#171717] flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (!currentQuestion) {
        return (
            <div className="min-h-screen bg-[#171717] flex items-center justify-center text-white">
                <p>No questions found.</p>
            </div>
        );
    }

    const currentResponse = responses.get(currentQuestion.id);

    return (
        <div className="min-h-screen bg-[#f0f0f0] text-gray-800 flex">
            {/* Main Question Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="bg-white border-b shadow-sm px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-medium text-gray-600">Section:</span>
                        {papers.map((paper, idx) => (
                            <button
                                key={paper.id}
                                onClick={() => setCurrentPaperIndex(idx)}
                                className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${idx === currentPaperIndex
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 hover:bg-gray-300"
                                    }`}
                            >
                                {paper.subject?.name || `Paper ${idx + 1}`}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg ${timeRemaining < 300 ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
                            }`}>
                            <Clock className="w-5 h-5" />
                            {formatTime(timeRemaining)}
                        </div>
                    </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 p-6 overflow-auto">
                    <div className="bg-white rounded-lg shadow-sm p-6 max-w-4xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">
                                Question {currentQuestionIndex + 1}
                            </h2>
                            <span className="text-sm text-gray-500">
                                {currentQuestion.marks} marks
                            </span>
                        </div>

                        <div className="prose prose-gray max-w-none mb-6">
                            <p className="text-gray-800 whitespace-pre-wrap">
                                {currentQuestion.question_text}
                            </p>
                            {currentQuestion.question_image && (
                                <img
                                    src={currentQuestion.question_image}
                                    alt="Question"
                                    className="max-w-md my-4"
                                />
                            )}
                        </div>

                        {/* Options for MCQ/MSQ */}
                        {(currentQuestion.question_type === "MCQ" || currentQuestion.question_type === "MSQ") && (
                            <div className="space-y-3">
                                {(currentQuestion.options || []).map((option, idx) => {
                                    const isSelected = currentQuestion.question_type === "MCQ"
                                        ? currentResponse?.answer === option.id
                                        : (currentResponse?.answer as string[] || []).includes(option.id);

                                    return (
                                        <label
                                            key={option.id}
                                            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                                                    ? "bg-blue-50 border-blue-300"
                                                    : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                                }`}
                                        >
                                            <input
                                                type={currentQuestion.question_type === "MCQ" ? "radio" : "checkbox"}
                                                name={`q-${currentQuestion.id}`}
                                                checked={isSelected}
                                                onChange={() => {
                                                    if (currentQuestion.question_type === "MCQ") {
                                                        handleAnswer(option.id);
                                                    } else {
                                                        const current = (currentResponse?.answer as string[]) || [];
                                                        const newAnswer = isSelected
                                                            ? current.filter(id => id !== option.id)
                                                            : [...current, option.id];
                                                        handleAnswer(newAnswer);
                                                    }
                                                }}
                                                className="mt-1"
                                            />
                                            <span>({String.fromCharCode(65 + idx)}) {option.text}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}

                        {/* Numeric Input for SA */}
                        {currentQuestion.question_type === "SA" && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Answer (Numeric)
                                </label>
                                <input
                                    type="number"
                                    value={(currentResponse?.answer as number) || ""}
                                    onChange={(e) => handleAnswer(parseFloat(e.target.value) || 0)}
                                    className="w-full max-w-xs px-4 py-3 border border-gray-300 rounded-lg text-lg"
                                    placeholder="Enter your answer"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Bar */}
                <div className="bg-white border-t px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleMark}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${currentResponse?.status?.includes("MARKED")
                                    ? "bg-purple-600 text-white"
                                    : "bg-gray-200 hover:bg-gray-300"
                                }`}
                        >
                            <Flag className="w-4 h-4" />
                            Mark for Review
                        </button>
                        <button
                            onClick={handleClear}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                        >
                            Clear Response
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigateQuestion(currentQuestionIndex - 1)}
                            disabled={currentQuestionIndex === 0}
                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <button
                            onClick={() => navigateQuestion(currentQuestionIndex + 1)}
                            disabled={currentQuestionIndex === allQuestions.length - 1}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                        >
                            Save & Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Sidebar - Question Palette */}
            <div className="w-80 bg-white border-l flex flex-col">
                {/* Status Legend */}
                <div className="p-4 border-b">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center text-white text-xs">
                                {getStatusCount("ANSWERED")}
                            </div>
                            <span>Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs">
                                {getStatusCount("NOT_ANSWERED")}
                            </div>
                            <span>Not Answered</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-zinc-700 rounded flex items-center justify-center text-white text-xs">
                                {allQuestions.length - [...responses.values()].length}
                            </div>
                            <span>Not Visited</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-purple-500 rounded flex items-center justify-center text-white text-xs">
                                {getStatusCount("MARKED") + getStatusCount("ANSWERED_MARKED")}
                            </div>
                            <span>Marked</span>
                        </div>
                    </div>
                </div>

                {/* Question Grid */}
                <div className="flex-1 overflow-auto p-4">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Choose a Question</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {allQuestions.map((q, idx) => {
                            const status = responses.get(q.id)?.status;
                            const isCurrent = idx === currentQuestionIndex;

                            return (
                                <button
                                    key={q.id}
                                    onClick={() => navigateQuestion(idx)}
                                    className={`
                                        w-8 h-8 rounded text-sm font-medium transition-all
                                        ${getStatusColor(status)}
                                        ${isCurrent ? "ring-2 ring-offset-2 ring-blue-500" : ""}
                                        text-white hover:opacity-80
                                    `}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Submit Button */}
                <div className="p-4 border-t">
                    <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <Send className="w-5 h-5" />
                        {submitting ? "Submitting..." : "Submit Exam"}
                    </button>
                </div>
            </div>
        </div>
    );
}
