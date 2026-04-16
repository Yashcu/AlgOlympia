import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { clerkMiddleware } from "@clerk/express";

import userRoutes from "./routes/user.routes";
import { requireUser } from "./middleware/auth.middleware";
import { attachUser } from "./middleware/user.middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

app.use(express.json());

// Clerk global middleware
app.use(clerkMiddleware());

// Route pipeline
app.use("/api/user", requireUser, attachUser, userRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port + ${PORT}`);
});
