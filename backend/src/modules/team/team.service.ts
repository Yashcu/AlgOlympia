import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { generateUniqueInviteCode } from "../../utils/inviteCode";
import { MAX_TEAM_SIZE } from "./team.constants";
import { emitTeamUpdate } from "../../lib/emitter";
import { redis } from "../../lib/redis";

/* =========================
   Cache Invalidation Helper
========================= */
const invalidateTeamCache = async (userIds: string[]) => {
    if (!userIds.length) return;

    const pipeline = redis.pipeline();

    userIds.forEach((id) => {
        pipeline.del(`team:user:${id}`);
    });

    await pipeline.exec();
};

/* =========================
   Create Team
========================= */
export const createTeam = async (userId: string, data: { name: string }) => {
    try {
        const team = await prisma.$transaction(async (tx) => {
            const existingMembership = await tx.teamMember.findUnique({
                where: { userId },
            });

            if (existingMembership) {
                throw new AppError(
                    "You are already in a team",
                    400,
                    "USER_ALREADY_IN_TEAM"
                );
            }

            const inviteCode = await generateUniqueInviteCode();

            return await tx.team.create({
                data: {
                    name: data.name,
                    inviteCode,
                    leaderId: userId,
                    members: {
                        create: [
                            {
                                userId,
                            },
                        ],
                    },
                },
                include: {
                    members: {
                        include: {
                            user: true,
                        },
                    },
                },
            });
        });

        // Invalidate cache and emit update after transaction succeeds
        await invalidateTeamCache([userId]);
        emitTeamUpdate(team.id);

        return team;
    } catch (err: any) {
        if (err.code === "P2002") {
            throw new AppError(
                "This team name is already taken",
                400,
                "TEAM_NAME_TAKEN"
            );
        }
        throw err;
    }
};

/* =========================
   Join Team
========================= */
export const joinTeam = async (userId: string, inviteCode: string) => {
    let affectedUserIds: string[] = [];
    let teamId: string;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const team = await tx.team.findUnique({
                where: { inviteCode },
                include: { members: true },
            });

            if (!team) {
                throw new AppError(
                    "Invalid invite code",
                    400,
                    "INVALID_INVITE_CODE"
                );
            }

            if (team.members.length >= MAX_TEAM_SIZE) {
                throw new AppError("Team is full", 400, "TEAM_IS_FULL");
            }

            if (team.members.some((m) => m.userId === userId)) {
                throw new AppError("Already in this team", 400, "ALREADY_IN_TEAM");
            }

            await tx.teamMember.create({
                data: {
                    userId,
                    teamId: team.id,
                },
            });

            const updatedTeam = await tx.team.findUnique({
                where: { id: team.id },
                include: { members: { include: { user: true } } },
            });

            affectedUserIds = [
                ...team.members.map((m) => m.userId),
                userId,
            ];
            teamId = team.id;

            return updatedTeam;
        });

        await invalidateTeamCache(affectedUserIds);
        emitTeamUpdate(teamId!);

        return result;
    } catch (err: any) {
        if (err.code === "P2002") {
            throw new AppError(
                "User already in a team",
                400,
                "USER_ALREADY_IN_A_TEAM"
            );
        }

        if (err.code === "P2034") {
            throw new AppError(
                "Conflict, please retry",
                409,
                "RETRY_TRANSACTION"
            );
        }

        throw err;
    }
};

/* =========================
   Get My Team (Cached)
========================= */
export const getMyTeam = async (userId: string) => {
    const cacheKey = `team:user:${userId}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    const membership = await prisma.teamMember.findUnique({
        where: { userId },
        include: {
            team: {
                include: {
                    members: {
                        include: { user: true },
                    },
                },
            },
        },
    });

    const team = membership?.team || null;

    await redis
        .pipeline()
        .set(cacheKey, JSON.stringify(team), "EX", 30)
        .exec();

    return team;
};

/* =========================
   Remove Member
========================= */
export const removeMember = async (
    leaderId: string,
    memberId: string
) => {
    if (leaderId === memberId) {
        throw new AppError(
            "Leader cannot remove themselves",
            400,
            "LEADER_CANNOT_REMOVE_SELF"
        );
    }

    let affectedUserIds: string[] = [];
    let teamId: string;

    const result = await prisma.$transaction(async (tx) => {
        const team = await tx.team.findFirst({
            where: { leaderId },
            include: { members: true },
        });

        if (!team) {
            throw new AppError(
                "Only leader can remove members",
                403,
                "ONLY_LEADER_CAN_REMOVE_MEMBERS"
            );
        }

        const isMember = team.members.some(
            (m) => m.userId === memberId
        );
        if (!isMember) {
            throw new AppError(
                "User is not in your team",
                400,
                "USER_NOT_IN_TEAM"
            );
        }

        await tx.teamMember.delete({
            where: { userId: memberId },
        });

        const updatedTeam = await tx.team.findUnique({
            where: { id: team.id },
            include: { members: { include: { user: true } } },
        });

        affectedUserIds = team.members.map((m: { userId: string }) => m.userId);
        teamId = team.id;

        return updatedTeam;
    });

    await invalidateTeamCache(affectedUserIds);
    emitTeamUpdate(teamId!);

    return result;
};

/* =========================
   Leave Team
========================= */
export const leaveTeam = async (userId: string) => {
    let affectedUserIds: string[] = [];
    let teamId: string;

    const result = await prisma.$transaction(async (tx) => {
        const membership = await tx.teamMember.findUnique({
            where: { userId },
            include: {
                team: {
                    include: { members: true },
                },
            },
        });

        if (!membership) {
            throw new AppError(
                "User not in a team",
                400,
                "USER_NOT_IN_A_TEAM"
            );
        }

        if (membership.team.leaderId === userId) {
            throw new AppError(
                "Leader must delete the team instead of leaving",
                400,
                "LEADER_MUST_DELETE_THE_TEAM_INSTEAD_OF_LEAVING"
            );
        }

        await tx.teamMember.delete({
            where: { userId },
        });

        const updatedTeam = await tx.team.findUnique({
            where: { id: membership.teamId },
            include: { members: { include: { user: true } } },
        });

        affectedUserIds =
            membership.team.members?.map((m) => m.userId) || [];
        teamId = membership.teamId;

        return updatedTeam;
    });

    await invalidateTeamCache(affectedUserIds);
    emitTeamUpdate(teamId!);

    return result;
};

/* =========================
   Delete Team
========================= */
export const deleteTeam = async (leaderId: string) => {
    const team = await prisma.team.findFirst({
        where: { leaderId },
    });

    if (!team) {
        throw new AppError(
            "Only leader can delete team",
            403,
            "ONLY_LEADER_CAN_DELETE_TEAM"
        );
    }

    const members = await prisma.teamMember.findMany({
        where: { teamId: team.id },
        select: { userId: true },
    });

    await prisma.$transaction(async (tx) => {
        await tx.teamMember.deleteMany({
            where: { teamId: team.id },
        });

        await tx.team.delete({
            where: { id: team.id },
        });
    });

    await invalidateTeamCache(members.map((m) => m.userId));
    emitTeamUpdate(team.id);

    return null;
};
