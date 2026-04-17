import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { getMyTeam } from "../api/team.api";
import type { Team } from "../types/team";

export const useTeam = () => {
    const { getToken, userId } = useAuth();

    return useQuery<Team | null>({
        queryKey: ["team"],
        enabled: !!userId,

        queryFn: async () => {
            const token = await getToken();

            if (!token) throw new Error("No auth token");

            const team = await getMyTeam(token);

            return team ?? null;
        },

        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: true,
        refetchInterval: false,

        retry: 1,
        retryDelay: 1000,
    });
};
