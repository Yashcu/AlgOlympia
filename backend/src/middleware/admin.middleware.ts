import { Request, NextFunction, Response } from "express";

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Admin only",
            code: "FORBIDDEN",
        });
    }
    next();
};