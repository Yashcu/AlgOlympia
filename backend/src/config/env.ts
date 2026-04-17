import 'dotenv/config'
import { z } from "zod";

const envSchema = z.object({
    PORT: z.coerce.number().default(5000),
    DATABASE_URL: z.string().url(),
    CLERK_SECRET_KEY: z.string(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    REDIS_URL: z.string().url(),
    FRONTEND_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
