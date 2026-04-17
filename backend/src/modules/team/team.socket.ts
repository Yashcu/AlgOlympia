import { Server, Socket } from "socket.io";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import { prisma } from "../../lib/prisma";

const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY!,
});

/**
 * Socket.io event handlers for real-time team updates
 * Optimized for 2000+ concurrent connections
 */
export const registerTeamSocket = (io: Server) => {
    io.use(async (socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error("Unauthorized"));
        }

        try {
            const payload = await clerk.verifyToken(token);

            const user = await prisma.user.findUnique({
                where: { clerkId: payload.sub },
                select: { id: true },
            });

            if (!user) {
                return next(new Error("User not found"));
            }

            // attach to socket
            socket.data.userId = user.id;

            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket: Socket) => {

        const userId = socket.data.userId;

        if (!userId) {
            console.warn(`[SOCKET] Connection rejected: missing userId for socket ${socket.id}`);
            socket.disconnect(true);
            return;
        }

        console.log(`[SOCKET] User ${userId} connected (socket: ${socket.id})`);

        // Track user's socket for later broadcasts
        socket.data.userId = userId;

        /**
         * Join team room
         * Client emits team ID when they load a team
         */
        socket.on("join_team", (teamId: string) => {
            if (!teamId || typeof teamId !== "string") {
                console.warn(`[SOCKET] Invalid teamId: ${teamId}`);
                return;
            }

            const roomName = `team:${teamId}`;
            socket.join(roomName);
            console.log(`[SOCKET] User ${userId} joined room ${roomName}`);

            // Notify team that user joined
            socket.to(roomName).emit("user:joined", {
                userId,
                timestamp: new Date().toISOString(),
            });
        });

        /**
         * Leave team room
         */
        socket.on("leave_team", (teamId: string) => {
            if (!teamId || typeof teamId !== "string") {
                return;
            }

            const roomName = `team:${teamId}`;
            socket.leave(roomName);
            console.log(`[SOCKET] User ${userId} left room ${roomName}`);

            // Notify team that user left
            socket.to(roomName).emit("user:left", {
                userId,
                timestamp: new Date().toISOString(),
            });
        });

        /**
         * Disconnect handler
         * Cleanup on disconnect
         */
        socket.on("disconnect", () => {
            console.log(`[SOCKET] User ${userId} disconnected (socket: ${socket.id})`);
        });

        /**
         * Error handler
         */
        socket.on("error", (error) => {
            console.error(`[SOCKET] Error for user ${userId}:`, error);
        });
    });

    // Log socket.io stats periodically
    setInterval(() => {
        const sockets = io.engine.clientsCount;
        const rooms = io.engine.generateId?.length ? io.sockets.adapter.rooms.size : 0;

        console.log(`[SOCKET_STATS] Connected: ${sockets}, Rooms: ${rooms}`);
    }, 60000); // Every minute
};
