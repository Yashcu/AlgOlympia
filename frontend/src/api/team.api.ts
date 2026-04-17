import { apiRequest } from "../lib/api";
import type { Team } from "../types/team";

export const getMyTeam = async (t: string): Promise<Team | null> => {
    return await apiRequest("/team/me", t);
}

export const createTeam = async (t: string, name: string): Promise<Team> => {
    return await apiRequest("/team", t, {
        method: "POST",
        body: JSON.stringify({ name }),
    });
}

export const joinTeam = async (t: string, inviteCode: string): Promise<Team> =>
    await apiRequest("/team/join", t, {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
    });

export const removeMember = async (
    t: string,
    memberId: string
): Promise<Team> =>
    await apiRequest(`/team/members/${memberId}`, t, {
        method: "DELETE",
    });

export const leaveTeam = async (t: string): Promise<Team | null> =>
    await apiRequest("/team/leave", t, { method: "POST" });

export const deleteTeam = async (t: string): Promise<null> =>
    await apiRequest("/team/me", t, {
        method: "DELETE",
    });
