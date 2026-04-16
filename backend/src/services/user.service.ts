import { prisma } from "../lib/prisma";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { mapClerkUser } from "../utils/clerk.mapper";

export const findOrCreateUser = async (clerkId: string) => {
    const existingUser = await prisma.user.findUnique({
        where: { clerkId },
    });

    if (existingUser) return existingUser;

    const clerkUser = await clerkClient.users.getUser(clerkId);
    const { email, name, avatar } = mapClerkUser(clerkUser);

    return prisma.user.create({
        data: {
            clerkId,
            email,
            name,
            avatar,
        },
    });
};
