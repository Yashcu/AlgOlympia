import { Router } from "express";
import { requireUser } from "../../middleware/auth.middleware";
import { attachUser } from "../../middleware/user.middleware";
import { isAdmin } from "../../middleware/admin.middleware";
import {
    createContestSchema,
    addProblemSchema,
    addTestcaseSchema,
    updateStatusSchema,
} from "./contest.validator";
import { validate } from "../../middleware/validate.middleware";
import {
    createContestController,
    addProblemController,
    addTestcaseController,
    updateContestStatusController,
    getAllContestsController,
    getAdminProblemsByContestController,
    getParticipantProblemsByContestController,
} from "./contest.controller";

const router = Router();

// 🔐 All admin routes require auth + ADMIN role
// Rate limiting is applied at the app level (apiLimiter in index.ts)
router.use(requireUser, attachUser, isAdmin);

// ── Contests ─────────────────────────────────────────────────────────────────
router.post("/contest", validate(createContestSchema), createContestController);
router.get("/contests", getAllContestsController);
router.patch("/contest/:id/status", validate(updateStatusSchema), updateContestStatusController);

// ── Problems ──────────────────────────────────────────────────────────────────
// Admin view: all testcases (hidden + visible), ownership checked, no time gate
router.post("/problem", validate(addProblemSchema), addProblemController);
router.get("/problems", getAdminProblemsByContestController);

// ── Testcases ─────────────────────────────────────────────────────────────────
router.post("/testcase", validate(addTestcaseSchema), addTestcaseController);

export default router;

// ── Participant-facing router (exported separately, mounted at /api/contests) ──
// This router exposes only public contest data — time-gated, cached, hidden testcases excluded.
export const participantContestRouter = Router();
participantContestRouter.use(requireUser, attachUser);
// Reads contestId from URL param :id, NOT from query string
participantContestRouter.get("/:id/problems", getParticipantProblemsByContestController);
