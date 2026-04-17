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