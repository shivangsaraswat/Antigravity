"use client";

import { useState } from "react";
import Editor from "@monaco-editor/react";
import { Play, Loader2, Terminal, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SandboxPage() {
    const [code, setCode] = useState("// Write your Go code here\npackage main\n\nimport \"fmt\"\n\nfunc main() {\n\tfmt.Println(\"Hello, Antigravity!\")\n}");
    const [output, setOutput] = useState("");
    const [isRunning, setIsRunning] = useState(false);
    const [language, setLanguage] = useState("go");

    const runCode = async () => {
        setIsRunning(true);
        setOutput("");

        try {
            const res = await fetch("http://localhost:8080/sandbox/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language, code }),
            });

            const data = await res.json();
            if (data.output) {
                setOutput(data.output);
            } else if (data.error) {
                setOutput("Error: " + data.error);
            } else {
                setOutput("No output returned.");
            }
        } catch (e) {
            setOutput("Execution failed: " + e);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="h-[calc(100vh-2rem)] p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/10 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <Terminal className="text-purple-400" /> Antigravity Sandbox
                    </h1>
                    <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-md px-3 py-1 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    >
                        <option value="go">Go (1.20)</option>
                        <option value="python">Python (3.10)</option>
                        <option value="javascript">JavaScript (Node 18)</option>
                    </select>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5">
                        <Save className="w-4 h-4 mr-2" /> Save
                    </Button>
                    <Button
                        size="sm"
                        onClick={runCode}
                        disabled={isRunning}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isRunning ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                        Run Code
                    </Button>
                </div>
            </div>

            {/* Main split */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0">
                {/* Editor */}
                <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#1e1e1e]">
                    <Editor
                        height="100%"
                        defaultLanguage="go"
                        language={language}
                        value={code}
                        onChange={(value) => setCode(value || "")}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            padding: { top: 16 },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>

                {/* Output */}
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black/80 backdrop-blur-md flex flex-col">
                    <div className="bg-white/5 px-4 py-2 border-b border-white/5 text-xs font-mono text-slate-400 uppercase tracking-widest">
                        Output Console
                    </div>
                    <div className="flex-1 p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap overflow-auto">
                        {output || <span className="text-slate-600 italic">// Output will appear here...</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}
