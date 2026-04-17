import { randomBytes } from "crypto";
import { prisma } from "../lib/prisma";
import { INVITE_CODE_LENGTH } from "../modules/team/team.constants";

const CHARS = "ABCDEFGHJKMNPQRSTVWXYZ23456789";

const generateCode = (): string => {
    const bytes = randomBytes(INVITE_CODE_LENGTH);
    return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
};

export const generateUniqueInviteCode = async (): Promise<string> => {
    for (let i = 0; i < 5; i++) {
        const code = generateCode();

        const existing = await prisma.team.findUnique({
            where: { inviteCode: code },
            select: { id: true },
        });

        if (!existing) return code;
    }

    throw new Error("Failed to generate unique invite code");
};
