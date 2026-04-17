import { z } from "zod";

export const createContestSchema = z.object({
    title:     z.string().min(3).max(200),
    startTime: z.string().datetime(),
    endTime:   z.string().datetime(),
});

export const addProblemSchema = z.object({
    contestId:   z.string().cuid(),
    title:       z.string().min(3).max(200),
    index:       z.string().min(1).max(2).transform((v) => v.toUpperCase()),
    description: z.string().min(10).max(100_000),   // Problem statement
    inputFormat: z.string().max(50_000).optional(),  // Input specification
    outputFormat:z.string().max(50_000).optional(),  // Output specification
    notes:       z.string().max(50_000).optional(),  // Notes / constraints
    timeLimit:   z.number().int().positive().max(30), // seconds, max 30
});

export const addTestcaseSchema = z.object({
    problemId: z.string().cuid(),
    input:     z.string().min(1).max(65_536),  // 64 KB max per field
    output:    z.string().min(1).max(65_536),
    isHidden:  z.boolean().optional(),
});

export const updateStatusSchema = z.object({
    status: z.enum(["DRAFT", "UPCOMING", "RUNNING", "ENDED"]),
});

export const contestsQuerySchema = z.object({
    page:  z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
});

// Inferred types for service layer — single source of truth
export type CreateContestInput = z.infer<typeof createContestSchema>;
export type AddProblemInput    = z.infer<typeof addProblemSchema>;
export type AddTestcaseInput   = z.infer<typeof addTestcaseSchema>;
export type ContestsQuery      = z.infer<typeof contestsQuerySchema>;