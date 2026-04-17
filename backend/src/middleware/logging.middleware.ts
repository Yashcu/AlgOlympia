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

    // ── What to log ───────────────────────────────────────────────────────────
    // Never log request/response headers — they're huge and contain JWTs
    serializers: {
        req(req) {
            return {
                id:     req.id,
                method: req.method,
                url:    req.url,
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },

    // ── Custom fields alongside the pino-http defaults ────────────────────────
    customProps: (req: Request) => ({
        userId: req.user?.id,
    }),

    // ── Single-line readable message ──────────────────────────────────────────
    customSuccessMessage(req, res) {
        return `${req.method} ${req.url} ${res.statusCode}`;
    },
    customErrorMessage(req, res, err) {
        return `${req.method} ${req.url} ${res.statusCode} — ${err.message}`;
    },

    // ── Skip health check noise ───────────────────────────────────────────────
    autoLogging: {
        ignore: (req) => req.url === "/health",
    },
});

export const errorHandler = (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const isOperational = err.isOperational === true;

    logger.error({
        err,
        requestId: req.id,
        userId: req.user?.id,
    });

    res.status(statusCode).json({
        success: false,
        message: isOperational ? err.message : "Internal Server Error",
        code: err.code || "INTERNAL_ERROR",
        errorId: req.id,
    });
};
