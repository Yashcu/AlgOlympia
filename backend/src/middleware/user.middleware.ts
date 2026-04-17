import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { AppError } from "../utils/AppError";
import { getOrCreateUser } from "../modules/user/user.service";

export const attachUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { userId } = getAuth(req);

    if (!userId) {
        throw new AppError("Unauthorized", 401, "UNAUTHORIZED");
    }

    const user = await getOrCreateUser(userId);

    req.user = user;
    next();
};
