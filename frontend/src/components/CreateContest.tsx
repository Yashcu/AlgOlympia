import { useState } from "react";
import { useCreateContest } from "../hooks/useAdmin";
import toast from 'react-hot-toast';
import Button from "./ui/Button";
import Input from "./ui/Input";

const CreateContest = () => {
    const { mutate, isPending } = useCreateContest();

    const [title, setTitle] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        if (!startTime || !endTime) {
            toast.error("Start time and end time are required");
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            toast.error("End time must be after start time");
            return;
        }

        mutate(
            {
                title,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
            },
            {
                onSuccess: () => {
                    toast.success("Contest created successfully!");
                    setTitle("");
                    setStartTime("");
                    setEndTime("");
                },
            }
        );
    };

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    Configure Contest
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                    Set up the basic details and scheduling for a new algorithmic competition.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title Input */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">
                        Contest Title
                    </label>
                    <Input
                        placeholder="e.g. Weekly Algorithm Sprint #42"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={isPending}
                    />
                </div>

                {/* Scheduling Group - Designed like an iOS Settings block */}
                <div className="p-5 rounded-2xl bg-zinc-50 border border-zinc-200/60 space-y-5">

                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-zinc-900">Schedule</h3>
                        <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-1 bg-zinc-200/50 text-zinc-600 rounded-md">
                            {Intl.DateTimeFormat().resolvedOptions().timeZone}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-medium text-zinc-600 mb-1.5 ml-1">
                                Start Time
                            </label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-600 mb-1.5 ml-1">
                                End Time
                            </label>
                            <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    <p className="text-xs text-zinc-500 flex items-center gap-1.5 pt-1">
                        <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Times are automatically handled in your local timezone.
                    </p>
                </div>

                {/* Submit Action */}
                <div className="pt-4 flex justify-end">
                    <Button
                        type="submit"
                        loading={isPending}
                        className="w-full sm:w-auto min-w-[160px]"
                    >
                        Create Contest
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateContest;