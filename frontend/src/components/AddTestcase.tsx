import { useState, useEffect } from "react"
import {
    useAddTestcase,
    useContests,
    useProblems,
} from "../hooks/useAdmin";
import type { Contest, Problem } from "../types/admin";
import Button from "./ui/Button";
import Input from "./ui/Input";
import toast from "react-hot-toast";

const AddTestcase = () => {
    const { data: contests } = useContests();
    const { mutate, isPending } = useAddTestcase();

    const [contestId, setContestId] = useState("");
    const [problemId, setProblemId] = useState("");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [isHidden, setIsHidden] = useState(true);

    const { data: problems } = useProblems(contestId);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!problemId) {
            toast.error("Select a problem");
            return;
        }
        if (!input.trim()) {
            toast.error("Input is required");
            return;
        }
        if (!output.trim()) {
            toast.error("Output is required");
            return;
        }

        mutate({
            problemId,
            input,
            output,
            isHidden,
        }, {
            onSuccess: () => {
                toast.success("Testcase added!");
                setInput("");
                setOutput("");
            },
        });
    };

    useEffect(() => {
        setProblemId("");
    }, [contestId]);

    const inputClasses = "w-full px-4 py-3 rounded-xl border border-zinc-200/80 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 disabled:opacity-50 disabled:bg-zinc-50";

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    Add Testcase
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                    Define the input and expected output for a problem. These are used for automated grading.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Selection Group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/60">
                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-1.5 ml-1">
                            Contest
                        </label>
                        <select
                            value={contestId}
                            onChange={(e) => setContestId(e.target.value)}
                            className={`${inputClasses} appearance-none cursor-pointer`}
                        >
                            <option value="">Select Contest</option>
                            {contests?.map((c: Contest) => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-600 mb-1.5 ml-1">
                            Problem
                        </label>
                        <select
                            value={problemId}
                            onChange={(e) => setProblemId(e.target.value)}
                            disabled={!contestId}
                            className={`${inputClasses} appearance-none cursor-pointer disabled:cursor-not-allowed`}
                        >
                            <option value="">Select Problem</option>
                            {problems?.map((p: Problem) => (
                                <option key={p.id} value={p.id}>
                                    {p.index} - {p.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Data Group */}
                <div className="grid grid-cols-1 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">
                            Input Data
                        </label>
                        <textarea
                            placeholder="Paste the test input here..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            rows={5}
                            className={`${inputClasses} font-mono resize-y`}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">
                            Expected Output
                        </label>
                        <textarea
                            placeholder="Paste the expected output here..."
                            value={output}
                            onChange={(e) => setOutput(e.target.value)}
                            rows={5}
                            className={`${inputClasses} font-mono resize-y`}
                        />
                    </div>
                </div>

                {/* Privacy Setting - iOS Style Toggle Row */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-200/60 bg-white shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-900">Hidden Testcase</span>
                        <span className="text-xs text-zinc-500">Visible only to admins; hidden from participants during contest.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <Input
                            type="checkbox"
                            checked={isHidden}
                            onChange={(e) => setIsHidden(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                </div>

                <div className="pt-2 flex justify-end">
                    <Button
                        type="submit"
                        loading={isPending}
                        className="w-full sm:w-auto min-w-[180px]"
                    >
                        Save Testcase
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default AddTestcase;