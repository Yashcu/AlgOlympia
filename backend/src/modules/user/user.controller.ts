import { Request, Response } from "express";

export const getMeController = (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        res.status(401).json({
            success: false,
            message: "Unauthorized",
            code: "UNAUTHORIZED",
        });
        return;
    }

    res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
    });
};
