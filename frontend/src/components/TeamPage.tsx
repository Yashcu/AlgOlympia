import { useState } from "react";
import TeamDashboard from "./TeamDashboard";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { Toggle } from "./ui/Toggle";
import { useTeam } from "../hooks/useTeam";
import { useUserData } from "../hooks/useUserData";
import { useTeamSocket } from "../hooks/useTeamSocket";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { createTeam, joinTeam } from "../api/team.api";
import { useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function TeamPage() {
    const { data: team, isLoading } = useTeam();
    const { data: user, isLoading: userLoading } = useUserData();

    // Form state
    const [mode, setMode] = useState("Join Team");
    const [name, setName] = useState("");
    const [inviteCode, setInviteCode] = useState("");
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    // ✅ controlled socket lifecycle
    useSocketConnection(user?.id);

    // ✅ explicit dependencies
    useTeamSocket(team?.id, user?.id);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) throw new Error("Unauthorized");

            if (mode === "Create Team") {
                if (!name.trim()) throw new Error("Team name is required");
                await createTeam(token, name);
                toast.success("Team created successfully!");
            } else {
                if (!inviteCode.trim()) throw new Error("Invite code is required");
                await joinTeam(token, inviteCode);
                toast.success("Joined team successfully!");
            }

            queryClient.invalidateQueries({ queryKey: ["team"] });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setError(message);
            toast.error(message);
        } finally {
            setFormLoading(false);
        }
    };

    if (isLoading || userLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-zinc-400 animate-pulse">Synchronizing team data...</p>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[75vh] w-full p-4 animate-in fade-in duration-500">
                <div className="w-full max-w-md bg-white border border-zinc-200/60 rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight">
                            {mode === "Join Team" ? "Join a Squad" : "Create a Squad"}
                        </h1>
                        <p className="text-sm text-zinc-500 mt-2">
                            {mode === "Join Team" ? "Enter an invite code to team up." : "Start a new team and invite your friends."}
                        </p>
                    </div>

                    <Toggle
                        options={["Join Team", "Create Team"]}
                        activeOption={mode}
                        onChange={(opt) => {
                            setMode(opt);
                            setError(null);
                        }}
                    />

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {mode === "Create Team" ? (
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">
                                    Team Name
                                </label>
                                <Input
                                    placeholder="e.g. The Innovators"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={formLoading}
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1.5 ml-1">
                                    Invite Code
                                </label>
                                <Input
                                    placeholder="e.g. ABC123XYZ"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value)}
                                    disabled={formLoading}
                                    className="uppercase tracking-widest font-mono"
                                />
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div className="pt-4">
                            <Button type="submit" fullWidth loading={formLoading}>
                                {mode === "Join Team" ? "Join Team" : "Create Team"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (!user) {
        return <div className="text-center mt-10 text-zinc-400 text-lg">Identity not verified</div>;
    }

    return <TeamDashboard team={team} user={user} />;
}
