import { Request, Response, NextFunction } from "express";
import pinoHttp from "pino-http";
import { logger } from "../lib/logger";
import { randomUUID } from "crypto";

export const attachRequestId = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    req.id = randomUUID();
    res.setHeader("x-request-id", req.id);
    next();
};

export const requestLogger = pinoHttp({
    logger,
    customProps: (req: Request) => ({
        userId: req.user?.id,
    }),
});

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;

    logger.error({
        err,
        requestId: req.id,
        userId: req.user?.id,
    });

    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        code: err.code || "INTERNAL_ERROR",
        errorId: req.id,
    });
};
