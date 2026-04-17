import express from "express";
import asyncHandler from "express-async-handler";

import {
    createTeamController,
    joinTeamController,
    getMyTeamController,
    leaveTeamController,
    removeMemberController,
    deleteTeamController,
} from "./team.controller";

import { validate } from "../../middleware/validate.middleware";
import {
    createTeamSchema,
    joinTeamSchema,
} from "./team.validator";

import {
    createTeamLimiter,
    joinTeamLimiter,
} from "../../middleware/rateLimit.middleware";

const router = express.Router();

// Create team
router.post(
    "/",
    createTeamLimiter,
    validate(createTeamSchema),
    asyncHandler(createTeamController)
);

// Join team
router.post(
    "/join",
    joinTeamLimiter,
    validate(joinTeamSchema),
    asyncHandler(joinTeamController)
);

// Get my team
router.get("/me", asyncHandler(getMyTeamController));

// Leave team
router.post("/leave", asyncHandler(leaveTeamController));

// Remove member (leader only)
router.delete(
    "/members/:memberId",
    asyncHandler(removeMemberController)
);

// Delete team (leader only)
router.delete(
    "/me",
    asyncHandler(deleteTeamController)
);

export default router;
