import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { findOrCreateUser } from "../services/user.service";

export const attachUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = getAuth(req);

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const user = await findOrCreateUser(userId);

        req.user = user;

        next();
    } catch (error) {
        console.error("ATTACH USER ERROR:", error);
        res.status(500).json({ message: "User sync failed" });
    }
};
