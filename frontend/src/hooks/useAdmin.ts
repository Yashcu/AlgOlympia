import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";

import {
    createContest,
    addProblem,
    addTestcase,
    updateContestStatus,
    getContests,
    getProblems,
} from "../api/admin.api";

import { mapError } from "../lib/errors";
import type { ApiError } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

// -------------------- CREATE CONTEST --------------------

export const useCreateContest = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            title: string;
            startTime: string;
            endTime: string;
        }) => {
            const token = await getToken();
            if (!token) throw new Error("No token");

            return createContest(token, data);
        },

        onSuccess: () => {
            // Toast is shown in the component — here we only invalidate cache
            queryClient.invalidateQueries({ queryKey: ["contests"] });
        },

        onError: (err: ApiError) => {
            toast.error(mapError(err.code));
        },
    });
};


// -------------------- ADD PROBLEM --------------------

export const useAddProblem = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: {
            contestId:    string;
            title:        string;
            index:        string;
            description:  string;
            inputFormat?: string;
            outputFormat?:string;
            notes?:       string;
            timeLimit:    number;
        }) => {
            const token = await getToken();
            if (!token) throw new Error("No token");

            return addProblem(token, data);
        },

        onSuccess: (_data, variables) => {
            // Toast is shown in the component
            queryClient.invalidateQueries({ queryKey: ["problems", variables.contestId] });
        },

        onError: (err: ApiError) => {
            toast.error(mapError(err.code));
        },
    });
};


// -------------------- ADD TESTCASE --------------------

export const useAddTestcase = () => {
    const { getToken } = useAuth();

    return useMutation({
        mutationFn: async (data: {
            problemId: string;
            input: string;
            output: string;
            isHidden?: boolean;
        }) => {
            const token = await getToken();
            if (!token) throw new Error("No token");

            return addTestcase(token, data);
        },

        onSuccess: () => {
            // Toast is shown in the component
        },

        onError: (err: ApiError) => {
            toast.error(mapError(err.code));
        },
    });
};


// -------------------- UPDATE CONTEST STATUS --------------------

export const useUpdateContestStatus = () => {
    const { getToken } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: { id: string; status: "DRAFT" | "UPCOMING" | "RUNNING" | "ENDED" }) => {
            const token = await getToken();
            if (!token) throw new Error("No token");

            return updateContestStatus(token, data.id, data.status);
        },

        onSuccess: () => {
            // Toast is shown in the component
            queryClient.invalidateQueries({ queryKey: ["contests"] });
        },

        onError: (err: ApiError) => {
            toast.error(mapError(err.code));
        },
    });
};


// -------------------- FETCH CONTESTS --------------------

export const useContests = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ["contests"],
        staleTime: 30_000, // 30 seconds — don't refetch on every window focus
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error("No token");

            const res = await getContests(token);
            // Handle both paginated { contests, total, page } and legacy flat array responses
            return Array.isArray(res.data) ? res.data : (res.contests ?? []);
        },
    });
};

// -------------------- FETCH PROBLEMS --------------------

export const useProblems = (contestId?: string) => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ["problems", contestId],
        enabled: !!contestId,
        staleTime: 60_000, // 60 seconds — problems don't change frequently
        queryFn: async () => {
            const token = await getToken();
            if (!token) throw new Error("No token");

            const res = await getProblems(token, contestId!);
            return res.data;
        },
    });
};