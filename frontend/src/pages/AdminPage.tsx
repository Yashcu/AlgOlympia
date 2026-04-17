import { useState } from "react";
import { Navigate } from "react-router-dom";

import CreateContest from "../components/CreateContest";
import AddProblem from "../components/AddProblem";
import AddTestcase from "../components/AddTestcase";
import ManageContest from "../components/ManageContest";

import { useUserData } from "../hooks/useUserData";
import { Toggle } from "../components/ui/Toggle";

// Map beautiful UI labels to your internal components
const TAB_OPTIONS = [
    "Create Contest",
    "Add Problem",
    "Add Testcase",
    "Manage Contests"
];

export default function AdminPage() {
    const { data: user, isLoading } = useUserData();
    const [activeTab, setActiveTab] = useState<string>(TAB_OPTIONS[0]);

    // 🔄 Premium Loading State
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-zinc-500 animate-pulse">Verifying permissions...</p>
            </div>
        );
    }

    // 🔐 Admin Check
    if (!user || user.role !== "ADMIN") {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4">

            {/* Header Section */}
            <div className="flex flex-col gap-2 border-b border-zinc-200/60 pb-6">
                <div className="inline-flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                        Admin Console
                    </h1>
                </div>
                <p className="text-sm text-zinc-500 pl-13">
                    Configure and manage the AlgOlympia platform infrastructure.
                </p>
            </div>

            {/* Navigation Toggle */}
            <div className="w-full">
                <Toggle
                    options={TAB_OPTIONS}
                    activeOption={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            {/* Main Content Area */}
            <div className="relative w-full bg-white border border-zinc-200/60 rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[400px]">
                {/* Using a key on this wrapper forces React to re-mount the component 
                    when the tab changes, allowing us to use fade-in animations on every tab switch.
                */}
                <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {activeTab === "Create Contest" && <CreateContest />}
                    {activeTab === "Add Problem" && <AddProblem />}
                    {activeTab === "Add Testcase" && <AddTestcase />}
                    {activeTab === "Manage Contests" && <ManageContest />}
                </div>
            </div>

        </div>
    );
}