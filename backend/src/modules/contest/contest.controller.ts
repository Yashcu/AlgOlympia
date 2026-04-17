import { Request, Response } from "express";
import {
    createContest,
    addProblem,
    addTestcase,
    updateContestStatus,
    getAllContests,
    getProblemsByContest,
    getAdminProblemsByContest,
} from "./contest.service";
import { AppError } from "../../utils/AppError";
import { ContestStatus } from "@prisma/client";
import { contestsQuerySchema } from "./contest.validator";

// ─── Create Contest ───────────────────────────────────────────────────────────
export const createContestController = async (req: Request, res: Response) => {
    const data = await createContest(req.body, req.user!.id);
    res.status(201).json({ success: true, data });
};

// ─── List All Contests (paginated) ────────────────────────────────────────────
export const getAllContestsController = async (req: Request, res: Response) => {
    const query = contestsQuerySchema.parse(req.query);
    const result = await getAllContests(query);
    res.json({ success: true, ...result });
};

// ─── Get Problems for Admin (all testcases, no time gate, ownership check) ───
export const getAdminProblemsByContestController = async (req: Request, res: Response) => {
    const { contestId } = req.query;

    if (!contestId || typeof contestId !== "string") {
        throw new AppError("contestId query param is required", 400, "MISSING_PARAM");
    }

    const problems = await getAdminProblemsByContest(contestId, req.user!.id);
    res.json({ success: true, data: problems });
};

// ─── Get Problems for Participants (time-gated, cached, visible testcases only)
export const getProblemsByContestController = async (req: Request, res: Response) => {
    const { contestId } = req.query;

    if (!contestId || typeof contestId !== "string") {
        throw new AppError("contestId query param is required", 400, "MISSING_PARAM");
    }

    const data = await getProblemsByContest(contestId);
    res.json({ success: true, data });
};

// ─── Get Problems by URL param (used by participant router: GET /api/contests/:id/problems)
export const getParticipantProblemsByContestController = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const contestId = req.params.id;
    const data = await getProblemsByContest(contestId);
    res.json({ success: true, data });
};

// ─── Add Problem ──────────────────────────────────────────────────────────────
export const addProblemController = async (req: Request, res: Response) => {
    const data = await addProblem(req.body, req.user!.id);
    res.status(201).json({ success: true, data });
};

// ─── Add Testcase ─────────────────────────────────────────────────────────────
export const addTestcaseController = async (req: Request, res: Response) => {
    const data = await addTestcase(req.body);
    res.status(201).json({ success: true, data });
};

// ─── Update Status ────────────────────────────────────────────────────────────
export const updateContestStatusController = async (
    req: Request<{ id: string }>,
    res: Response
) => {
    const data = await updateContestStatus(
        req.params.id,
        req.body.status as ContestStatus,
        req.user!.id
    );
    res.json({ success: true, data });
};