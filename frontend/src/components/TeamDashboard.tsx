import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '@clerk/clerk-react';
import { removeMember, leaveTeam, deleteTeam } from '../api/team.api';
import Button from './ui/Button';
import Card from './ui/Card';
import { useState } from "react";
import type { Team, User } from '../types/team';
import toast from "react-hot-toast";

export default function TeamDashboard({
    team,
    user,
}: {
    team: Team;
    user: User;
}) {
    const queryClient = useQueryClient();
    const { getToken } = useAuth();

    const isLeader = team.leaderId === user.id;

    const removeMutation = useMutation({
        mutationFn: async (memberId: string) => {
            const t = await getToken();
            return removeMember(t!, memberId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            toast.success("Member removed");
        },
        onError: (e: Error) => {
            toast.error(e.message);
        }
    });

    const leaveMutation = useMutation({
        mutationFn: async () => {
            const t = await getToken();
            return leaveTeam(t!);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["team"] });
            toast.success("Left team");
        },
        onError: (e: Error) => {
            toast.error(e.message);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async () => {
            const t = await getToken();
            return deleteTeam(t!);
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["team"] });
            toast.success("Team deleted");
        },
        onError: (e: Error) => {
            toast.error(e.message);
        }
    });

    const [codeCopied, setCodeCopied] = useState(false);

    const copyCode = async () => {
        await navigator.clipboard.writeText(team.inviteCode);
        setCodeCopied(true);
        toast.success("Code copied to clipboard!", { icon: "📋" });
        setTimeout(() => setCodeCopied(false), 2000);
    };

    return (
        <section className="mx-auto w-full max-w-3xl space-y-6 animate-in fade-in duration-500">
            {/* Header Card */}
            <Card className="overflow-hidden">
                <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.4fr,1fr] lg:items-start">
                    <div className="space-y-4">
                        <div className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600 border border-zinc-200/60">
                            {isLeader ? 'Team Leader' : 'Team Member'}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-3xl font-semibold tracking-tight text-zinc-900">{team.name}</h2>
                            <p className="text-sm text-zinc-500">{team.members.length} of 3 members</p>
                        </div>
                    </div>

                    {/* Invite Code - Styled like an iOS setting module */}
                    <div className="rounded-2xl bg-zinc-50 border border-zinc-200/50 p-5">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">Invite Code</p>
                        <button
                            onClick={copyCode}
                            className="group flex w-full items-center justify-between rounded-xl border border-zinc-200/80 bg-white px-4 py-3 text-left transition-all hover:border-zinc-300 hover:shadow-sm active:scale-[0.98]"
                        >
                            <span className="font-mono text-base font-medium tracking-widest text-zinc-900">{team.inviteCode}</span>
                            <span className="text-zinc-400 transition-colors group-hover:text-zinc-900">
                                {codeCopied ? (
                                    <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <rect x="9" y="9" width="11" height="11" rx="2" />
                                        <path strokeLinecap="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                    </svg>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </Card>

            {/* Roster Card */}
            <Card className="overflow-hidden">
                <div className="border-b border-zinc-100 bg-zinc-50/50 px-6 py-4">
                    <h3 className="text-sm font-medium text-zinc-900">Roster</h3>
                </div>
                <div className="divide-y divide-zinc-100">
                    {team.members.map((m) => (
                        <div key={m.id} className="flex items-center justify-between px-6 py-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-zinc-100 text-sm font-medium text-zinc-600 border border-zinc-200/60">
                                    {m.user.name?.[0]?.toUpperCase() ?? '?'}
                                </div>
                                <div>
                                    <p className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                                        {m.user.name || 'Anonymous User'}
                                        {team.leaderId === m.user.id && (
                                            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                                                Leader
                                            </span>
                                        )}
                                    </p>
                                    <p className="text-sm text-zinc-500">{m.user.email}</p>
                                </div>
                            </div>

                            {isLeader && m.user.id !== user.id && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    loading={removeMutation.isPending && removeMutation.variables === m.user.id}
                                    onClick={() => removeMutation.mutate(m.user.id)}
                                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                    Remove
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Danger Actions */}
            <div className="flex justify-end pt-2">
                {!isLeader && (
                    <Button variant="ghost" onClick={() => window.confirm('Leave team?') && leaveMutation.mutate()} loading={leaveMutation.isPending} className="text-red-500 hover:bg-red-50">
                        Leave Team
                    </Button>
                )}
                {isLeader && (
                    <Button variant="danger" onClick={() => window.confirm('Delete team? This cannot be undone.') && deleteMutation.mutate()} loading={deleteMutation.isPending}>
                        Delete Team
                    </Button>
                )}
            </div>
        </section>
    );
}
