import { apiRequest } from "../lib/api";

export const createContest = async (
    token: string,
    data: {
        title: string;
        startTime: string;
        endTime: string;
    }
) => {
    return apiRequest("/admin/contest", token, {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const addProblem = async (
    token: string,
    data: {
        contestId:    string;
        title:        string;
        index:        string;
        description:  string;
        inputFormat?: string;
        outputFormat?:string;
        notes?:       string;
        timeLimit:    number;
    }
) => {
    return apiRequest("/admin/problem", token, {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const addTestcase = async (
    token: string,
    data: {
        problemId: string;
        input: string;
        output: string;
        isHidden?: boolean;
    }
) => {
    return apiRequest("/admin/testcase", token, {
        method: "POST",
        body: JSON.stringify(data),
    });
};

export const updateContestStatus = async (
    token: string,
    id: string,
    status: string
) => {
    return apiRequest(`/admin/contest/${id}/status`, token, {
        method: "PATCH",
        body: JSON.stringify({ status }),
    });
};

export const getContests = async (token: string) => {
    return apiRequest("/admin/contests", token);
};

export const getProblems = async (
    token: string,
    contestId: string
) => {
    return apiRequest(`/admin/problems?contestId=${contestId}`, token);
};