import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "../lib/redis";

const isDev = process.env.NODE_ENV === "development";

/**
 * Shared Redis store
 */
const store = new RedisStore({
    sendCommand: (...args: string[]) =>
        redis.call(args[0], ...args.slice(1)) as unknown as Promise<any>,
});

/**
 * Base limiter factory
 */
const createLimiter = (max: number, windowMs: number) => {
    if (isDev) {
        // 🚫 Disable in dev
        return (_req: any, _res: any, next: any) => next();
    }

    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,

        keyGenerator: (req: any) => {
            if (req.user?.id) return `user:${req.user.id}`;
            return `ip:${ipKeyGenerator(req)}`;
        },

        store,

        skip: async () => {
            try {
                await redis.ping();
                return false;
            } catch {
                return true; // fail open
            }
        },
    });
};

/**
 * 🔹 Contest-ready limits
 */

// High throughput APIs (main usage)
export const apiLimiter = createLimiter(400, 60_000);

// Sensitive actions
export const createTeamLimiter = createLimiter(3, 60_000);
export const joinTeamLimiter = createLimiter(10, 60_000);
