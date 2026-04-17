import { useState } from "react";
import { useContests, useUpdateContestStatus } from "../hooks/useAdmin";
import toast from "react-hot-toast";
import Button from "./ui/Button";

const ManageContest = () => {
    const { data: contests, isLoading } = useContests();
    const { mutate, isPending } = useUpdateContestStatus();

    const [contestId, setContestId] = useState("");

    const selectedContest = contests?.find((c: any) => c.id === contestId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <span className="text-sm font-medium text-zinc-500 animate-pulse">
                    Loading contests...
                </span>
            </div>
        );
    }

    const handlePublish = () => {
        if (!contestId) return toast.error("Select a contest");
        if (selectedContest?.status !== "DRAFT") return;

        mutate({ id: contestId, status: "UPCOMING" }, {
            onSuccess: () => toast.success("Contest published as UPCOMING")
        });
    };

    const handleStart = () => {
        if (!contestId) return toast.error("Select a contest");
        // Button is disabled unless status === UPCOMING, but guard here too for safety
        if (selectedContest?.status !== "UPCOMING") return;

        mutate({ id: contestId, status: "RUNNING" }, {
            onSuccess: () => toast.success("Contest is now LIVE 🎉")
        });
    };

    const handleEnd = () => {
        if (!contestId) return toast.error("Select a contest");
        // Button is disabled unless status === RUNNING, but guard here too for safety
        if (selectedContest?.status !== "RUNNING") return;

        mutate({ id: contestId, status: "ENDED" }, {
            onSuccess: () => toast.success("Contest has ended")
        });
    };

    // Shared styling for the select dropdown
    const selectClasses = "w-full px-4 py-3 rounded-xl border border-zinc-200/80 bg-white text-sm text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 focus:outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 appearance-none cursor-pointer";

    return (
        <div className="max-w-2xl mx-auto animate-in fade-in duration-300">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
                    Manage Contest Status
                </h2>
                <p className="mt-2 text-sm text-zinc-500">
                    Control the lifecycle of your competitions. Manually start or end contests for participants.
                </p>
            </div>

            <div className="space-y-6">
                {/* Contest Picker */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">
                        Select Contest to Manage
                    </label>
                    <div className="relative">
                        <select
                            value={contestId}
                            onChange={(e) => setContestId(e.target.value)}
                            className={selectClasses}
                        >
                            <option value="">Select a contest...</option>
                            {contests?.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.title}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-500">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Control Panel Card */}
                {selectedContest ? (
                    <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/60 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-200/50">
                            <div>
                                <h3 className="font-semibold text-zinc-900">{selectedContest.title}</h3>
                                <p className="text-xs text-zinc-500 mt-0.5">ID: {selectedContest.id}</p>
                            </div>

                            {/* Dynamic Status Badge */}
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${selectedContest.status === "RUNNING" ? "bg-green-500 animate-pulse" :
                                        selectedContest.status === "UPCOMING" ? "bg-amber-400" : "bg-zinc-400"
                                    }`} />
                                <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                                    {selectedContest.status}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Button
                                onClick={handlePublish}
                                loading={isPending}
                                disabled={selectedContest.status !== "DRAFT"}
                                className="h-12 bg-indigo-600 hover:bg-indigo-700"
                            >
                                Publish to Upcoming
                            </Button>

                            <Button
                                onClick={handleStart}
                                loading={isPending}
                                disabled={selectedContest.status !== "UPCOMING"}
                                className="h-12"
                            >
                                Start Contest
                            </Button>

                            <Button
                                variant="outline"
                                onClick={handleEnd}
                                loading={isPending}
                                disabled={selectedContest.status !== "RUNNING"}
                                className="h-12 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            >
                                End Contest
                            </Button>
                        </div>

                        {selectedContest.status === "ENDED" && (
                            <p className="mt-4 text-center text-xs text-zinc-400">
                                This contest has concluded and cannot be restarted.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 text-center">
                        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-zinc-900">No Contest Selected</p>
                        <p className="text-xs text-zinc-500 mt-1">Select a contest above to view its live controls.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageContest;