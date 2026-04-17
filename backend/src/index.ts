import { Server } from "socket.io";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import helmet from "helmet";
import compression from "compression";

import { env } from "./config/env";
import userRoutes from "./modules/user/user.routes";
import teamRoutes from "./modules/team/team.routes";

import { requireUser } from "./middleware/auth.middleware";
import { attachUser } from "./middleware/user.middleware";
import {
    requestLogger,
    errorHandler,
    attachRequestId,
} from "./middleware/logging.middleware";
import { apiLimiter } from "./middleware/rateLimit.middleware";

import { registerTeamSocket } from "./modules/team/team.socket";
import { setEmitter } from "./lib/emitter";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis } from "./lib/redis";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";

const app = express();

/* =========================
   Redis Setup (Safe)
========================= */
const pubClient = redis;
const subClient = redis.duplicate();

let redisReady = true;

pubClient.on("error", (err) => {
    logger.error({ err }, "Redis error");
    redisReady = false;
});

subClient.on("error", (err) => {
    logger.error({ err }, "Redis sub error");
    redisReady = false;
});

/* =========================
   Core Middleware
========================= */
app.use(helmet());

app.use(
    cors({
        origin:
            env.NODE_ENV === "production"
                ? [env.FRONTEND_URL]
                : ["http://localhost:5173"],
        credentials: true,
    })
);

app.set("trust proxy", 1);

app.use(express.json({ limit: "10kb" }));
app.use(compression());

app.use(attachRequestId);
app.use(requestLogger);

/* =========================
   Timeout Protection
========================= */
app.use((req, res, next) => {
    res.setTimeout(5000, () => {
        if (!res.headersSent) {
            res.status(408).json({
                success: false,
                message: "Request timeout",
            });
        }
    });
    next();
});

/* =========================
   Auth + Clerk
========================= */
app.use(clerkMiddleware());

/* =========================
   Health Check (NO AUTH)
========================= */
app.get("/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        await redis.ping();

        res.json({
            status: "ok",
            db: "connected",
            redis: "connected",
            uptime: process.uptime(),
        });
    } catch {
        res.status(500).json({ status: "error" });
    }
});

/* =========================
   Protected Pipeline
========================= */
app.use(requireUser);
app.use(attachUser);

/* =========================
   Routes
========================= */
app.use("/api/user", apiLimiter, userRoutes);
app.use("/api/team", apiLimiter, teamRoutes);

/* =========================
   404 Handler
========================= */
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});

/* =========================
   Error Handler
========================= */
app.use(errorHandler);

/* =========================
   Server Start
========================= */
const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} (${env.NODE_ENV})`);
});

/* =========================
   Socket.io Setup
========================= */
export const io = new Server(server, {
    cors: {
        origin:
            env.NODE_ENV === "production"
                ? [env.FRONTEND_URL]
                : ["http://localhost:5173"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 30000,
    pingTimeout: 5000,
    maxHttpBufferSize: 1e5,
    path: "/socket.io",
});

/* Only attach adapter if Redis is ready */
if (redisReady) {
    io.adapter(createAdapter(pubClient, subClient));
}

/* Emit helper */
setEmitter((teamId: string) => {
    io.to(`team:${teamId}`).emit("team:updated");
});

registerTeamSocket(io);

/* =========================
   Graceful Shutdown
========================= */
const shutdown = async () => {
    logger.info("Shutting down...");

    server.close(async () => {
        await prisma.$disconnect();
        await pubClient.quit();
        await subClient.quit();

        logger.info("Shutdown complete");
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
