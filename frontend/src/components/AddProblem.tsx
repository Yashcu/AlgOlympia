import { useState } from "react";
import { useAddProblem, useContests } from "../hooks/useAdmin";
import type { Contest } from "../types/admin";
import Button from "./ui/Button";
import Input from "./ui/Input";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

// ── Tab definition ────────────────────────────────────────────────────────────
type Tab = "statement" | "input" | "output" | "notes";

const TABS: { id: Tab; label: string; required: boolean; placeholder: string }[] = [
    {
        id: "statement",
        label: "Statement",
        required: true,
        placeholder: `Paste or write the problem statement here.

Supports Markdown and LaTeX math:
- Inline math:  $n$ boxes, $1 \\le n \\le 100$
- Block math:   $$\\sum_{i=1}^{n} a_i$$
- Bold:         **text**
- Italic:       *text*
- List:         - item`,
    },
    {
        id: "input",
        label: "Input",
        required: false,
        placeholder: `Describe the input format.

Example:
The first line contains a single integer $t$ $(1 \\le t \\le 100)$ — the number of test cases.

Each test case consists of two lines:
- The first line contains two integers $n$ and $k$ $(1 \\le k \\le n \\le 100)$.
- The second line contains $n$ integers $a_1, a_2, \\ldots, a_n$ $(1 \\le a_i \\le 10^9)$.`,
    },
    {
        id: "output",
        label: "Output",
        required: false,
        placeholder: `Describe the output format.

Example:
For each test case, print YES (case-insensitive) if the array can be sorted, or NO otherwise.`,
    },
    {
        id: "notes",
        label: "Notes",
        required: false,
        placeholder: `Optional: additional constraints, hints, or example explanations.`,
    },
];

// ── Markdown preview component ─────────────────────────────────────────────
const MathPreview = ({ content }: { content: string }) => {
    if (!content.trim()) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-sm text-zinc-400 italic">Preview will appear here as you type.</p>
            </div>
        );
    }
    return (
        <div className="prose prose-sm prose-zinc max-w-none h-full overflow-y-auto px-1">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

// ── Main component ────────────────────────────────────────────────────────────
const AddProblem = () => {
    const { data: contests, isLoading } = useContests();
    const { mutate, isPending } = useAddProblem();

    const [contestId, setContestId]   = useState("");
    const [title, setTitle]           = useState("");
    const [index, setIndex]           = useState("A");
    const [timeLimit, setTimeLimit]   = useState(2);

    // Tab content
    const [statement, setStatement]     = useState("");
    const [inputFmt, setInputFmt]       = useState("");
    const [outputFmt, setOutputFmt]     = useState("");
    const [notes, setNotes]             = useState("");

    const [activeTab, setActiveTab]   = useState<Tab>("statement");
    const [showPreview, setShowPreview] = useState(false);

    const contentMap: Record<Tab, string> = {
        statement,
        input:  inputFmt,
        output: outputFmt,
        notes,
    };

    const setterMap: Record<Tab, (v: string) => void> = {
        statement: setStatement,
        input:     setInputFmt,
        output:    setOutputFmt,
        notes:     setNotes,
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!contestId) { toast.error("Select a contest"); return; }
        if (!title.trim()) { toast.error("Problem title required"); return; }
        if (!statement.trim() || statement.trim().length < 10) {
            toast.error("Statement must be at least 10 characters");
            return;
        }
        if (timeLimit <= 0) { toast.error("Time limit must be > 0"); return; }

        mutate({
            contestId,
            title,
            index,
            description:  statement,
            inputFormat:  inputFmt  || undefined,
            outputFormat: outputFmt || undefined,
            notes:        notes     || undefined,
            timeLimit,
        }, {
            onSuccess: () => {
                toast.success("Problem published!");
                setTitle("");
                setStatement("");
                setInputFmt("");
                setOutputFmt("");
                setNotes("");
            },
        });
    };

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-zinc-200/80 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 disabled:opacity-50 disabled:bg-zinc-50";

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <span className="text-sm font-medium text-zinc-500 animate-pulse">Loading contests...</span>
            </div>
        );
    }

    const activeContent = contentMap[activeTab];
    const activeSetter  = setterMap[activeTab];
    const activeTabDef  = TABS.find(t => t.id === activeTab)!;

    return (
        <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Add Problem</h2>
                <p className="mt-1 text-sm text-zinc-500">
                    Paste directly from Codeforces. Supports Markdown and LaTeX math ($...$).
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

                {/* ── Row 1: Contest + Index + Time limit ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Contest */}
                    <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">Contest</label>
                        <div className="relative">
                            <select
                                value={contestId}
                                onChange={(e) => setContestId(e.target.value)}
                                disabled={isPending}
                                className={`${inputClasses} appearance-none cursor-pointer`}
                            >
                                <option value="" disabled>Select contest...</option>
                                {contests?.map((c: Contest) => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">Problem Title</label>
                        <Input
                            placeholder="e.g. Halloumi Boxes"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    {/* Index + Time limit */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">Index</label>
                            <Input
                                placeholder="A"
                                value={index}
                                onChange={(e) => setIndex(e.target.value)}
                                disabled={isPending}
                                className="font-mono uppercase text-center"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">TL (sec)</label>
                            <Input
                                type="number"
                                min="1"
                                max="30"
                                step="1"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(Number(e.target.value))}
                                disabled={isPending}
                            />
                        </div>
                    </div>
                </div>

                {/* ── Section editor ── */}
                <div className="rounded-2xl border border-zinc-200/80 overflow-hidden shadow-sm">

                    {/* Tab bar */}
                    <div className="flex items-center border-b border-zinc-200/80 bg-zinc-50/60">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-3 text-sm font-medium transition-colors relative ${
                                    activeTab === tab.id
                                        ? "text-zinc-900 bg-white"
                                        : "text-zinc-500 hover:text-zinc-700"
                                }`}
                            >
                                {tab.label}
                                {tab.required && (
                                    <span className="ml-1 text-red-400">*</span>
                                )}
                                {/* Active indicator */}
                                {activeTab === tab.id && (
                                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900" />
                                )}
                                {/* Fill indicator dot */}
                                {contentMap[tab.id].trim() && activeTab !== tab.id && (
                                    <span className="absolute top-2.5 right-2 w-1.5 h-1.5 rounded-full bg-green-400" />
                                )}
                            </button>
                        ))}

                        {/* Preview toggle */}
                        <button
                            type="button"
                            onClick={() => setShowPreview(!showPreview)}
                            className={`ml-auto mr-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                showPreview
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {showPreview ? "Editing" : "Preview"}
                        </button>
                    </div>

                    {/* Editor / Preview pane */}
                    <div className={`grid ${showPreview ? "grid-cols-2 divide-x divide-zinc-200/80" : "grid-cols-1"}`}>
                        {/* Textarea */}
                        <textarea
                            key={activeTab}
                            value={activeContent}
                            onChange={(e) => activeSetter(e.target.value)}
                            placeholder={activeTabDef.placeholder}
                            disabled={isPending}
                            rows={18}
                            className="w-full p-5 font-mono text-sm text-zinc-800 bg-white placeholder:text-zinc-300 placeholder:font-sans resize-none focus:outline-none"
                        />

                        {/* Preview */}
                        {showPreview && (
                            <div className="p-5 bg-white min-h-[336px]">
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                                    Rendered Preview
                                </p>
                                <MathPreview content={activeContent} />
                            </div>
                        )}
                    </div>

                    {/* Bottom status bar */}
                    <div className="px-5 py-2 bg-zinc-50/60 border-t border-zinc-200/80 flex items-center gap-4">
                        <span className="text-[11px] text-zinc-400 font-mono">
                            {activeContent.length.toLocaleString()} chars
                        </span>
                        <span className="text-[11px] text-zinc-400">·</span>
                        <span className="text-[11px] text-zinc-400">
                            Inline math: <code className="font-mono bg-zinc-100 px-1 rounded">$n \le 100$</code>
                        </span>
                        <span className="text-[11px] text-zinc-400">·</span>
                        <span className="text-[11px] text-zinc-400">
                            Block math: <code className="font-mono bg-zinc-100 px-1 rounded">{"$$\\sum_{i=1}^n a_i$$"}</code>
                        </span>
                    </div>
                </div>

                {/* ── Quick reference ── */}
                <details className="group rounded-xl border border-zinc-200/60 bg-zinc-50/50 overflow-hidden">
                    <summary className="px-4 py-3 text-sm font-medium text-zinc-600 cursor-pointer select-none flex items-center gap-2 hover:text-zinc-900 transition-colors">
                        <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        LaTeX &amp; Markdown Cheat Sheet
                    </summary>
                    <div className="px-4 pb-4 pt-1 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                        {[
                            { label: "Inline variable",    code: "$n$" },
                            { label: "Inline fraction",    code: "$\\frac{1}{2}$" },
                            { label: "Subscript",          code: "$a_{i}$" },
                            { label: "Superscript",        code: "$10^9$" },
                            { label: "Range",              code: "$1 \\le n \\le 100$" },
                            { label: "Block equation",     code: "$$\\sum_{i=1}^{n} a_i$$" },
                            { label: "Bold",               code: "**text**" },
                            { label: "Italic",             code: "*text*" },
                            { label: "Code (mono)",        code: "`code`" },
                            { label: "Bullet list",        code: "- item" },
                            { label: "Ordered list",       code: "1. item" },
                            { label: "Dagger footnote",    code: "$^\\dagger$" },
                        ].map(({ label, code }) => (
                            <div key={label} className="bg-white rounded-lg border border-zinc-200/60 px-3 py-2">
                                <p className="text-zinc-500 mb-1">{label}</p>
                                <code className="font-mono text-zinc-800 text-[11px]">{code}</code>
                            </div>
                        ))}
                    </div>
                </details>

                {/* Submit */}
                <div className="flex justify-end">
                    <Button
                        type="submit"
                        loading={isPending}
                        className="min-w-[180px]"
                    >
                        Publish Problem
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddProblem;