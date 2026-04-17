import { z } from "zod";

export const createTeamSchema = z.object({
    name: z
        .string()
        .min(3, "Team name must be at least 3 characters")
        .max(50, "Team name too long")
        .regex(/^[a-zA-Z0-9\s\-]+$/, "Team name can only contain letters, numbers, spaces and hyphens")
        .trim(),
});

export const joinTeamSchema = z.object({
    inviteCode: z
        .string()
        .length(8, "Invite code must be 8 characters")
        .toUpperCase(),
});

export const removeMemberSchema = z.object({
    memberId: z.string().uuid("Invalid member ID"),
});
