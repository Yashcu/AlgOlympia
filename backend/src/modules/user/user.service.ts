import { prisma } from "../../lib/prisma";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { mapClerkUser } from "../../utils/clerk.mapper";
import { redis } from "../../lib/redis";
import { logger } from "../../lib/logger";

const USER_CACHE_TTL = 3600; // 1 hour

export const getOrCreateUser = async (clerkId: string) => {
    const cacheKey = `user:clerk:${clerkId}`;

    // 1. Try Redis cache first
    const cached = await redis.get(cacheKey).catch(() => null);
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch {
            // corrupted cache entry — fall through to DB
        }
    }

    // 2. Try DB
    let user = await prisma.user.findUnique({ where: { clerkId } });

    if (!user) {
        // 3. Fetch from Clerk and create
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const mapped = mapClerkUser(clerkUser);

        try {
            user = await prisma.user.create({
                data: { clerkId, ...mapped },
            });
        } catch (err: any) {
            if (err.code === "P2002") {
                user = await prisma.user.findUniqueOrThrow({ where: { clerkId } });
            } else {
                throw err;
            }
        }
    }

    // 4. Warm cache
    await redis
        .set(cacheKey, JSON.stringify(user), "EX", USER_CACHE_TTL)
        .catch((err) => logger.warn({ err }, "Failed to cache user in Redis"));

    return user;
};

/**
 * Call this whenever a user's role or profile changes so the cache stays consistent.
 */
export const invalidateUserCache = async (clerkId: string) => {
    await redis.del(`user:clerk:${clerkId}`).catch(() => null);
};

