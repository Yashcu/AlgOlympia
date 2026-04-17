import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "../utils/AppError";
import { logger } from "../lib/logger";

export const validate =
    (schema: ZodSchema) =>
        (req: Request, res: Response, next: NextFunction) => {
            const result = schema.safeParse(req.body);

            if (!result.success) {
                const firstError = result.error.issues[0];

                logger.warn({
                    path: firstError.path.join("."),
                    message: firstError.message,
                    requestId: req.id,
                });

                throw new AppError(
                    `Validation error: ${firstError.path.join(".")} - ${firstError.message}`,
                    400,
                    "VALIDATION_ERROR"
                );
            }

            req.body = result.data;
            next();
        };
