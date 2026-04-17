import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { ContestStatus } from "@prisma/client";
import { redis } from "../../lib/redis";
import { logger } from "../../lib/logger";
import { isContestLocked, isValidTransition } from "../../utils/contest.guards";
import type {
    CreateContestInput,
    AddProblemInput,
    AddTestcaseInput,
    ContestsQuery,
} from "./contest.validator";

// ─────────────────────────────────────────────
// CREATE CONTEST
// ─────────────────────────────────────────────
export const createContest = async (data: CreateContestInput, userId: string) => {
    if (new Date(data.startTime) >= new Date(data.endTime)) {
        throw new AppError("Start time must be before end time", 400, "INVALID_TIME_RANGE");
    }

    return prisma.contest.create({
        data: {
            title:      data.title,
            startTime:  new Date(data.startTime),
            endTime:    new Date(data.endTime),
            createdById: userId,
        },
    });
};

// ─────────────────────────────────────────────
// ADD PROBLEM
// ─────────────────────────────────────────────
export const addProblem = async (data: AddProblemInput, userId: string) => {
    const contest = await prisma.contest.findUnique({
        where: { id: data.contestId },
    });

    if (!contest) {
        throw new AppError("Contest not found", 404, "CONTEST_NOT_FOUND");
    }

    // Ownership check — only the admin who created the contest can add problems
    if (contest.createdById !== userId) {
        throw new AppError("You do not own this contest", 403, "FORBIDDEN");
    }

    // Block modifications once the contest is locked (RUNNING or ENDED)
    if (isContestLocked(contest.status)) {
        throw new AppError(
            `Cannot add problems to a ${contest.status} contest`,
            400,
            "CONTEST_LOCKED"
        );
    }

    return prisma.problem.create({
        data: {
            contestId:   data.contestId,
            title:       data.title,
            index:       data.index, // already uppercased by validator transform
            description: data.description,
            inputFormat: data.inputFormat,
            outputFormat:data.outputFormat,
            notes:       data.notes,
            timeLimit:   data.timeLimit,
        },
    });
};

// ─────────────────────────────────────────────
// ADD TESTCASE
// ─────────────────────────────────────────────
export const addTestcase = async (data: AddTestcaseInput) => {
    const problem = await prisma.problem.findUnique({
        where: { id: data.problemId },
        include: { contest: true },
    });

    if (!problem) {
        throw new AppError("Problem not found", 404, "PROBLEM_NOT_FOUND");
    }

    if (isContestLocked(problem.contest.status)) {
        throw new AppError(
            `Cannot modify testcases for a ${problem.contest.status} contest`,
            400,
            "CONTEST_LOCKED"
        );
    }

    return prisma.testcase.create({
        data: {
            problemId: data.problemId,
            input:     data.input,
            output:    data.output,
            isHidden:  data.isHidden ?? true,
        },
    });
};

// ─────────────────────────────────────────────
// UPDATE CONTEST STATUS
// ─────────────────────────────────────────────
export const updateContestStatus = async (
    contestId: string,
    newStatus: ContestStatus,
    requestingUserId: string
) => {
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });

    if (!contest) {
        throw new AppError("Contest not found", 404, "CONTEST_NOT_FOUND");
    }

    // Ownership check
    if (contest.createdById !== requestingUserId) {
        throw new AppError("You do not own this contest", 403, "FORBIDDEN");
    }

    // Enforce strict FSM — no arbitrary jumps
    if (!isValidTransition(contest.status, newStatus)) {
        throw new AppError(
            `Cannot transition contest from ${contest.status} to ${newStatus}`,
            400,
            "INVALID_STATUS_TRANSITION"
        );
    }

    const updatedContest = await prisma.contest.update({
        where: { id: contestId },
        data:  { status: newStatus },
    });

    const problemCacheKey = `contest:problems:${contestId}`;
    const startCacheKey   = `contest:start:${contestId}`;

    if (newStatus === ContestStatus.RUNNING) {
        // Warm cache only on RUNNING — problems are now locked, cache is stable
        const problems = await prisma.problem.findMany({
            where:   { contestId },
            orderBy: { index: "asc" },
            include: {
                testcases: { where: { isHidden: false } },
            },
        });

        const cachePayload = JSON.stringify({
            success:    true,
            data:       problems,
            _cachedAt:  new Date().toISOString(),
        });

        // 24-hour safety TTL — in case contest never transitions to ENDED
        await redis.set(problemCacheKey, cachePayload, "EX", 86_400);
        await redis.set(startCacheKey, updatedContest.startTime.toISOString(), "EX", 86_400);

        logger.info({ contestId, problemCount: problems.length }, "Contest cache warmed");
    }

    if (newStatus === ContestStatus.DRAFT || newStatus === ContestStatus.ENDED) {
        // Clear cache so stale data is never served after contest ends
        await Promise.all([
            redis.del(problemCacheKey),
            redis.del(startCacheKey),
        ]);
        logger.info({ contestId, newStatus }, "Contest cache cleared");
    }

    return updatedContest;
};

// ─────────────────────────────────────────────
// GET ALL CONTESTS (paginated)
// ─────────────────────────────────────────────
export const getAllContests = async (query: ContestsQuery) => {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [contests, total] = await Promise.all([
        prisma.contest.findMany({
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
        }),
        prisma.contest.count(),
    ]);

    return {
        contests,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
};

// ─────────────────────────────────────────────
// GET PROBLEMS BY CONTEST (participant-facing)
// Always returns a typed array — no dual-return pattern
// ─────────────────────────────────────────────
export const getProblemsByContest = async (contestId: string) => {
    // Gate: contest must have started
    const startTimeStr = await redis.get(`contest:start:${contestId}`);

    if (startTimeStr) {
        if (new Date() < new Date(startTimeStr)) {
            throw new AppError("Contest has not started yet", 403, "CONTEST_NOT_STARTED");
        }
    } else {
        const contest = await prisma.contest.findUnique({ where: { id: contestId } });
        if (!contest) throw new AppError("Contest not found", 404, "CONTEST_NOT_FOUND");
        if (new Date() < contest.startTime) {
            throw new AppError("Contest has not started yet", 403, "CONTEST_NOT_STARTED");
        }
    }

    // Try cache
    const cached = await redis.get(`contest:problems:${contestId}`);
    if (cached) {
        return JSON.parse(cached).data;
    }

    // DB fallback (only reached if cache was not warmed — shouldn't happen in normal flow)
    return prisma.problem.findMany({
        where:   { contestId },
        orderBy: { index: "asc" },
        include: { testcases: { where: { isHidden: false } } },
    });
};

// ─────────────────────────────────────────────
// GET PROBLEMS BY CONTEST (admin-facing — all testcases, no time gate)
// ─────────────────────────────────────────────
export const getAdminProblemsByContest = async (contestId: string, requestingUserId: string) => {
    const contest = await prisma.contest.findUnique({ where: { id: contestId } });

    if (!contest) throw new AppError("Contest not found", 404, "CONTEST_NOT_FOUND");

    if (contest.createdById !== requestingUserId) {
        throw new AppError("You do not own this contest", 403, "FORBIDDEN");
    }

    return prisma.problem.findMany({
        where:   { contestId },
        orderBy: { index: "asc" },
        include: { testcases: true }, // admin sees ALL testcases, including hidden
    });
};