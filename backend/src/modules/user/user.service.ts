import { prisma } from "../../lib/prisma";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { mapClerkUser } from "../../utils/clerk.mapper";

export const getOrCreateUser = async (clerkId: string) => {
    let user = await prisma.user.findUnique({
        where: { clerkId },
    });

    if (user) return user;

    const clerkUser = await clerkClient.users.getUser(clerkId);

    const mapped = mapClerkUser(clerkUser);

    try {
        return await prisma.user.create({
            data: {
                clerkId,
                ...mapped,
            },
        });
    } catch (err: any) {
        if (err.code === "P2002") {
            return prisma.user.findUniqueOrThrow({
                where: { clerkId },
            });
        }
        throw err;
    }
};
