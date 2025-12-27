"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    ChevronLeft,
    ChevronRight,
    Flag,
    Clock,
    User,
    Info,
    Menu,
    LogOut,
    AlertCircle
} from "lucide-react";

interface Option {
    id: string;
    text: string;
    is_correct?: boolean;
}

interface Question {
    id: string;
    question_number: number;
    question_id: string;
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
    const [showInstructions, setShowInstructions] = useState(true);
    // const [userName, setUserName] = useState("Candidate"); // Removed as per instructions

    const questionStartTime = useRef<number>(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const currentPaper = papers[currentPaperIndex];
    // Filter questions by current paper/section
    const currentSectionQuestions = currentPaper?.questions || [];
    const currentQuestion = currentSectionQuestions[currentQuestionIndex];

    // Global question list for palette (flattened)
    const allQuestionsFlat = papers.flatMap(p => p.questions);

    // Find global index for the current question
    const globalQuestionIndex = allQuestionsFlat.findIndex(q => q.id === currentQuestion?.id);

    useEffect(() => {
        // const name = localStorage.getItem("ag_user_name");
        // if (name) setUserName(name);
        fetchExamData();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!showInstructions && timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [showInstructions, timeRemaining]); // Depend on showInstructions

    const fetchExamData = async () => {
        const token = localStorage.getItem("ag_token");
        if (!token) {
            router.push("/auth/login");
            return;
        }

        try {
            const attemptRes = await fetch(`http://localhost:8080/exam/attempt/${attemptId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!attemptRes.ok) {
                router.push("/dashboard/exams");
                return;
            }

            const attempt = await attemptRes.json();
            setTimeRemaining(attempt.time_remaining_secs);

            if (attempt.responses) {
                const savedResponses = new Map<string, Response>();
                Object.entries(attempt.responses).forEach(([qId, resp]: [string, any]) => {
                    savedResponses.set(qId, resp);
                });
                setResponses(savedResponses);
            }

            let paperIDs: string[] = [];
            if (typeof attempt.paper_ids === 'string') {
                try {
                    paperIDs = JSON.parse(attempt.paper_ids || "[]");
                } catch (e) {
                    paperIDs = [];
                }
            } else if (Array.isArray(attempt.paper_ids)) {
                paperIDs = attempt.paper_ids;
            }

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

    const saveResponse = async (questionId: string, response: Response) => {
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
    };

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
        // Don't auto-save to DB on every click, wait for "Save & Next"
        questionStartTime.current = Date.now();
    };

    // Triggered by "Save & Next"
    const handleSaveNext = () => {
        if (!currentQuestion) return;
        const resp = responses.get(currentQuestion.id);

        let status: QuestionStatus = "NOT_ANSWERED";
        if (resp && resp.answer !== null && resp.answer !== undefined && (Array.isArray(resp.answer) ? resp.answer.length > 0 : true)) {
            status = resp.status === "MARKED" || resp.status === "ANSWERED_MARKED" ? "ANSWERED_MARKED" : "ANSWERED";
        } else {
            status = "NOT_ANSWERED";
        }

        const finalResponse: Response = {
            answer: resp?.answer || null,
            status: status,
            time_spent: (resp?.time_spent || 0)
        };

        setResponses(prev => new Map(prev).set(currentQuestion.id, finalResponse));
        saveResponse(currentQuestion.id, finalResponse);
        navigateNext();
    };


    const handleMarkReview = () => {
        if (!currentQuestion) return;
        const existing = responses.get(currentQuestion.id);

        let newStatus: QuestionStatus = "MARKED";
        if (existing?.status === "ANSWERED" || existing?.status === "ANSWERED_MARKED" || (existing?.answer)) {
            newStatus = "ANSWERED_MARKED";
        }

        const newResponse: Response = {
            answer: existing?.answer || null,
            status: newStatus,
            time_spent: existing?.time_spent || 0
        };

        setResponses(prev => new Map(prev).set(currentQuestion.id, newResponse));
        saveResponse(currentQuestion.id, newResponse);
        navigateNext();
    };

    const handleClear = () => {
        if (!currentQuestion) return;
        const existing = responses.get(currentQuestion.id);
        const newResponse: Response = {
            answer: null,
            status: "NOT_ANSWERED", // Clear status too
            time_spent: existing?.time_spent || 0
        };
        setResponses(prev => new Map(prev).set(currentQuestion.id, newResponse));
        saveResponse(currentQuestion.id, newResponse); // Save clear immediately
    };

    const navigateNext = () => {
        if (currentQuestionIndex < currentSectionQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else if (currentPaperIndex < papers.length - 1) {
            setCurrentPaperIndex(prev => prev + 1);
            setCurrentQuestionIndex(0);
        }
    };

    // Jump to specific question
    const handleJumpToQuestion = (paperIdx: number, qIdx: number) => {
        // Should check visible status
        const q = papers[paperIdx].questions[qIdx];
        if (!responses.has(q.id)) {
            // Mark as visited (NOT_ANSWERED) if fresh visit
            const newResponse = { answer: null, status: "NOT_ANSWERED" as QuestionStatus, time_spent: 0 };
            setResponses(prev => new Map(prev).set(q.id, newResponse));
            saveResponse(q.id, newResponse);
        }
        setCurrentPaperIndex(paperIdx);
        setCurrentQuestionIndex(qIdx);
    }

    const handleExit = async () => {
        if (!window.confirm("You are about to exit the exam. This will submit your current progress and end the exam. Are you sure?")) return;
        handleSubmit();
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

    // Legend Counts
    const getStatusCount = (status: QuestionStatus) => {
        return allQuestionsFlat.filter(q => responses.get(q.id)?.status === status).length;
    };

    const notVisitedCount = allQuestionsFlat.filter(q => !responses.has(q.id)).length;


    // --- Status Colors (JEE Style) ---
    const getStatusStyle = (status: QuestionStatus | undefined, isCurrent: boolean) => {
        if (isCurrent) return "border-2 border-black animate-pulse"; // Current question highlight
        switch (status) {
            case "ANSWERED": return "bg-[#22c55e] text-white"; // Green
            case "NOT_ANSWERED": return "bg-[#ef4444] text-white"; // Red
            case "MARKED": return "bg-[#a855f7] text-white rounded-full"; // Purple (Circle)
            case "ANSWERED_MARKED": return "bg-[#a855f7] text-white relative after:content-['✓'] after:absolute after:bottom-0 after:right-1 after:text-xs";
            default: return "bg-white border border-gray-300 text-black"; // Not Visited (White/Gray)
        }
    };


    if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-100 font-bold text-lg">Loading Exam Environment...</div>;

    // --- Instructions Screen ---
    if (showInstructions) {
        return (
            <div className="fixed inset-0 z-50 bg-white flex flex-col font-sans">
                <header className="bg-[#1e40af] text-white p-4 text-center font-bold text-xl flex justify-between items-center px-8 shadow-md">
                    <span>Important Instructions</span>
                    <button onClick={() => router.push('/dashboard/exams')} className="text-white hover:text-gray-200">
                        <LogOut className="w-6 h-6" />
                    </button>
                </header>
                <div className="flex-1 overflow-auto p-8 max-w-5xl mx-auto text-gray-800 space-y-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                        <p className="font-bold text-blue-800">Please read the following instructions carefully.</p>
                    </div>

                    <ul className="list-disc pl-5 space-y-3 text-base leading-relaxed">
                        <li>Total duration of the examination is <strong>{formatTime(timeRemaining)}</strong>.</li>
                        <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time.</li>
                        <li>The question palette displayed on the right side of screen will show the status of each question using one of the following symbols:
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 bg-gray-50 p-4 rounded border">
                                <div className="flex items-center gap-2"><span className="w-6 h-6 bg-white border border-gray-300 block rounded shadow-sm"></span> <span className="text-sm">Not Visited</span></div>
                                <div className="flex items-center gap-2"><span className="w-6 h-6 bg-[#ef4444] block rounded shadow-sm text-white flex items-center justify-center text-xs"></span> <span className="text-sm">Not Answered</span></div>
                                <div className="flex items-center gap-2"><span className="w-6 h-6 bg-[#22c55e] block rounded shadow-sm text-white flex items-center justify-center text-xs"></span> <span className="text-sm">Answered</span></div>
                                <div className="flex items-center gap-2"><span className="w-6 h-6 bg-[#a855f7] rounded-full block shadow-sm text-white flex items-center justify-center text-xs"></span> <span className="text-sm">Marked for Review</span></div>
                            </div>
                        </li>
                        <li>Click on <strong>Save & Next</strong> to save your answer for the current question and then go to the next question.</li>
                        <li>Click on <strong>Mark for Review & Next</strong> to save your answer for the current question, mark it for review, and then go to the next question.</li>
                        <li>To answer a question, do the following:
                            <ol className="list-decimal pl-5 mt-2 space-y-1 text-gray-700">
                                <li>Click on the question number in the Question Palette at the right of your screen to go to that numbered question directly. Note that using this option does NOT save your answer to the current question.</li>
                                <li>Click on Save & Next to save your answer for the current question and then go to the next question.</li>
                                <li>Click on Mark for Review & Next to save your answer for the current question, mark it for review, and then go to the next question.</li>
                            </ol>
                        </li>
                    </ul>

                    <div className="mt-8 border-t pt-6">
                        <label className="flex items-center gap-3 cursor-pointer p-4 hover:bg-gray-50 rounded transition-colors select-none">
                            <input type="checkbox" className="w-6 h-6 accent-blue-700" />
                            <span className="font-semibold text-lg">I have read and understood the instructions. All computer hardware allotted to me are in proper working condition.</span>
                        </label>
                    </div>
                </div>
                <div className="p-4 border-t bg-gray-100 flex justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                    <button
                        onClick={() => setShowInstructions(false)}
                        className="bg-[#1e40af] hover:bg-blue-800 text-white px-12 py-3 rounded-lg text-xl font-bold transition-all shadow-lg hover:shadow-xl transform active:scale-95"
                    >
                        I am ready to begin
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-[#f3f4f6] flex flex-col overflow-hidden font-sans text-base">
            {/* --- Header --- */}
            <header className="bg-[#1e40af] text-white h-16 flex items-center justify-between px-6 shrink-0 shadow-md z-20 relative">
                <div className="font-bold text-xl tracking-tight truncate max-w-[50%]">
                    {/* Display Actual Paper Name or Fallback, removed "Exams:" prefix for cleaner look */}
                    {currentPaper?.name || "Loading Paper..."}
                </div>

                <div className="flex items-center gap-4">
                    {/* Timer Box - Moved to Right as requested */}
                    <div className="bg-white text-black px-4 py-2 rounded-md font-mono font-bold text-xl border border-gray-200 shadow-sm flex items-center gap-2 min-w-[140px] justify-center">
                        <Clock className="w-5 h-5 text-gray-600" />
                        <span className={timeRemaining < 300 ? "text-red-600 animate-pulse" : "text-gray-900"}>{formatTime(timeRemaining)}</span>
                    </div>

                    {/* Exit Button */}
                    <button
                        onClick={handleExit}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm shadow-sm transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" /> EXIT
                    </button>
                </div>
            </header>

            {/* --- Main Content --- */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* --- Left Area (Question) --- */}
                <main className="flex-1 flex flex-col bg-white m-0 md:m-4 md:mr-0 rounded-none md:rounded-lg shadow-sm border border-gray-200 overflow-hidden relative">

                    {/* REMOVED: Section Tabs */}
                    {/* REMOVED: Question Header Info (like Type, Marks) per user request to clean up, 
                        BUT "Question No" is essential. Keeping minimal header. */}

                    <div className="border-b px-8 py-4 flex justify-between items-center bg-white shrink-0">
                        <div className="font-bold text-xl text-[#1e40af]">
                            Question {currentQuestionIndex + 1}
                        </div>
                        <div className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded">
                            {currentQuestion?.question_type} (+{currentQuestion?.marks}, -0)
                        </div>
                    </div>

                    {/* Scrollable Question Content */}
                    <div className="flex-1 overflow-y-auto p-8 relative">
                        {currentQuestion ? (
                            <div className="w-full max-w-none mx-auto selection:bg-blue-100">
                                {/* Question Text - LEFT ALIGNED, Larger Font */}
                                <div className="text-justify text-lg md:text-xl leading-relaxed font-medium mb-8 text-gray-900">
                                    <p className="whitespace-pre-wrap">{currentQuestion.question_text}</p>
                                    {currentQuestion.question_image && (
                                        <div className="mt-6">
                                            <img src={currentQuestion.question_image} alt="Question Reference" className="max-w-full rounded border border-gray-200 shadow-sm" />
                                        </div>
                                    )}
                                </div>

                                {/* Options */}
                                <div className="grid gap-4 max-w-4xl">
                                    {currentQuestion.options?.map((opt, idx) => {
                                        const isSelected = currentQuestion.question_type === "MCQ"
                                            ? responses.get(currentQuestion.id)?.answer === opt.id
                                            : ((responses.get(currentQuestion.id)?.answer as string[]) || []).includes(opt.id)

                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={() => {
                                                    if (currentQuestion.question_type === "MCQ") handleAnswer(opt.id);
                                                    else {
                                                        const curr = (responses.get(currentQuestion.id)?.answer as string[]) || [];
                                                        handleAnswer(isSelected ? curr.filter(i => i !== opt.id) : [...curr, opt.id]);
                                                    }
                                                }}
                                                className={`
                                                    relative flex items-center gap-4 p-5 rounded-lg border-2 cursor-pointer transition-all group
                                                    ${isSelected
                                                        ? "border-[#1e40af] bg-blue-50/50 shadow-md"
                                                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                                    }
                                                `}
                                            >
                                                {/* Custom Radio/Checkbox Visual */}
                                                <div className={`
                                                     w-6 h-6 shrink-0 flex items-center justify-center rounded-full border-2 transition-colors
                                                     ${isSelected ? "border-[#1e40af] bg-[#1e40af]" : "border-gray-400 group-hover:border-[#1e40af]"}
                                                 `}>
                                                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                </div>

                                                <div className="flex-1 text-lg">
                                                    <span className="font-bold text-gray-500 mr-3">({String.fromCharCode(65 + idx)})</span>
                                                    <span className={isSelected ? "font-medium text-gray-900" : "text-gray-700"}>{opt.text}</span>
                                                </div>
                                            </div>
                                        )
                                    })}

                                    {/* SA Input */}
                                    {currentQuestion.question_type === "SA" && (
                                        <div className="mt-4">
                                            <label className="block font-bold mb-3 text-lg text-gray-800">Your Answer:</label>
                                            <input
                                                type="number"
                                                className="border-2 border-gray-300 p-4 rounded-lg text-xl w-64 focus:border-[#1e40af] focus:ring-4 focus:ring-blue-100 outline-none transition-all"
                                                placeholder="Enter value..."
                                                value={(responses.get(currentQuestion.id)?.answer as number) || ""}
                                                onChange={(e) => handleAnswer(parseFloat(e.target.value))}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-400 text-xl font-medium">Select a question from the palette</div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t bg-white px-8 py-4 shrink-0 flex flex-wrap gap-4 justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        <div className="flex gap-4">
                            <button onClick={handleMarkReview} className="px-6 py-2.5 bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 font-bold text-gray-600 transition-all">
                                Mark for Review
                            </button>
                            <button onClick={handleClear} className="px-6 py-2.5 bg-white border-2 border-gray-200 rounded-lg shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-700 font-bold text-gray-600 transition-all">
                                Clear Response
                            </button>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={handleSaveNext}
                                className="px-10 py-2.5 bg-[#22c55e] hover:bg-green-600 text-white rounded-lg shadow-md hover:shadow-lg font-bold text-lg transition-all transform active:scale-95"
                            >
                                Save & Next
                            </button>
                        </div>
                    </div>

                </main>


                {/* --- Right Sidebar (Palette) --- */}
                <aside className="w-[300px] xl:w-[350px] bg-white border-l shadow-xl flex flex-col shrink-0 z-20 h-full">
                    {/* Legend */}
                    <div className="p-5 bg-gray-50 border-b">
                        <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-gray-600">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center bg-white border-2 border-gray-200 rounded text-gray-400">{notVisitedCount}</span>
                                <span>Not Visited</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center text-white bg-[#ef4444] rounded shadow-sm">{getStatusCount("NOT_ANSWERED")}</span>
                                <span>Not Answered</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center text-white bg-[#22c55e] rounded shadow-sm">{getStatusCount("ANSWERED")}</span>
                                <span>Answered</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 flex items-center justify-center text-white bg-[#a855f7] rounded-full shadow-sm">{getStatusCount("MARKED")}</span>
                                <span>Marked for Review</span>
                            </div>
                        </div>
                    </div>

                    {/* Question Palette Grid */}
                    <div className="flex-1 overflow-y-auto p-4 bg-white">
                        <h3 className="bg-[#3b82f6] text-white px-4 py-2 font-bold text-sm mb-4 rounded shadow-sm">
                            Question Palette
                        </h3>
                        <div className="grid grid-cols-5 gap-3">
                            {papers.map((p, pIdx) => (
                                p.questions.map((q, qIdx) => {
                                    // Only show if it matches current paper/section
                                    if (pIdx !== currentPaperIndex) return null;

                                    const status = responses.get(q.id)?.status;
                                    const isCurrent = (pIdx === currentPaperIndex && qIdx === currentQuestionIndex);

                                    return (
                                        <button
                                            key={q.id}
                                            onClick={() => handleJumpToQuestion(pIdx, qIdx)}
                                            className={`
                                                 h-12 w-12 flex items-center justify-center text-sm font-bold shadow-sm transition-all rounded hover:brightness-110 active:scale-95
                                                 ${getStatusStyle(status, isCurrent)}
                                                 ${isCurrent ? "ring-2 ring-offset-2 ring-blue-500 scale-105" : ""}
                                             `}
                                        >
                                            {qIdx + 1}
                                        </button>
                                    )
                                })
                            ))}
                        </div>
                    </div>

                    {/* Sidebar Footer - REMOVED extraneous buttons */}
                    <div className="p-6 bg-gray-50 border-t space-y-4">
                        {/* Only Submit Button remains */}
                        <button
                            onClick={handleSubmit}
                            className="w-full py-4 bg-[#22c55e] text-white rounded-lg font-bold text-lg hover:bg-green-600 shadow-md transform active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            SUBMIT EXAM
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    );
}
