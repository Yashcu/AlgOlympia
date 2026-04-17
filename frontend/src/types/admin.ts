export type CreateContestInput = {
    title: string;
    startTime: string;
    endTime: string;
};

export type AddProblemInput = {
    contestId: string;
    title: string;
    index: string;
    description: string;
    timeLimit: number;
};

export type AddTestcaseInput = {
    problemId: string;
    input: string;
    output: string;
    isHidden?: boolean;
};

export type Contest = {
    id: string;
    title: string;
    status: "DRAFT" | "UPCOMING" | "RUNNING" | "ENDED";
    startTime: string;
    endTime: string;
};

export type Problem = {
    id: string;
    title: string;
    index: string;
};