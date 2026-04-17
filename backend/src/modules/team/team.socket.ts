import { Server, Socket } from "socket.io";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { prisma } from "../../lib/prisma";
import { redis } from "../../lib/redis";
import { logger } from "../../lib/logger";

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * Socket.io event handlers for real-time team updates
 */
export const registerTeamSocket = (io: Server) => {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Unauthorized"));
        }

        try {
            const payload = await clerk.verifyToken(token);

            const cacheKey = `user:clerk:${payload.sub}`;
            const cached = await redis.get(cacheKey);

            let userId: string | null = null;

            if (cached) {
                try {
                    // user.service.ts stores the full User object as JSON
                    // e.g. {"id":"uuid","clerkId":"...","email":"..."}
                    const parsed = JSON.parse(cached);
                    userId = parsed.id ?? null;
                } catch {
                    // Legacy format: plain userId string (fallback safety)
                    userId = cached;
                }
            }

            if (!userId) {
                // Cache miss — go to DB
                const user = await prisma.user.findUnique({
                    where: { clerkId: payload.sub },
                    select: { id: true },
                });

                if (!user) return next(new Error("User not found"));
                userId = user.id;
            }

            // Attach the plain UUID — NOT the full JSON object
            socket.data.userId = userId;

            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });


    io.on("connection", (socket: Socket) => {

        const userId = socket.data.userId as string;

        if (!userId) {
            socket.disconnect(true);
            return;
        }

        logger.info({ userId, socketId: socket.id }, "Socket connected");

        /**
         * Join team room
         * Client emits team ID when they load a team
         */
        socket.on("join_team", async (teamId: string) => {
            if (!teamId || typeof teamId !== "string") return;

            try {
                // 1. Check Redis cache first (created by your team.service.ts)
                const cacheKey = `team:user:${userId}`;
                let actualTeamId: string | null = null;

                const cachedTeam = await redis.get(cacheKey);
                if (cachedTeam) {
                    actualTeamId = JSON.parse(cachedTeam)?.id ?? null;
                } else {
                    // 2. Fallback to DB if cache is empty
                    const membership = await prisma.teamMember.findFirst({
                        where: { userId }
                    });
                    actualTeamId = membership?.teamId ?? null;
                }

                // 3. The Security Lock
                if (actualTeamId !== teamId) {
                    logger.warn({ userId, teamId }, "Socket join_team rejected — not a member");
                    return; // Silently reject
                }

                const room = `team:${teamId}`;
                socket.join(room);
                logger.info({ userId, room }, "Socket joined room");

                socket.to(room).emit("user:joined", {
                    userId,
                    timestamp: new Date().toISOString(),
                });
            } catch (error) {
                logger.error({ error, userId }, "Socket join_team error");
            }
        });

        /**
         * Leave team room
         */
        socket.on("leave_team", (teamId: string) => {
            if (!teamId || typeof teamId !== "string") {
                return;
            }

            const room = `team:${teamId}`;
            socket.leave(room);
            logger.info({ userId, room }, "Socket left room");

            // Notify team that user left
            socket.to(room).emit("user:left", {
                userId,
                timestamp: new Date().toISOString(),
            });
        });

        /**
         * Disconnect handler
         * Cleanup on disconnect
         */
        socket.on("disconnect", () => {
            logger.info({ userId, socketId: socket.id }, "Socket disconnected");
        });

        /**
         * Error handler
         */
        socket.on("error", (error) => {
            logger.error({ error, userId }, "Socket error");
        });
    });
};
