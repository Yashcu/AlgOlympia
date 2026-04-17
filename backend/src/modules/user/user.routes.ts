import express from "express";
import asyncHandler from "express-async-handler";
import { getMeController } from "./user.controller";

const router = express.Router();

router.get("/me", asyncHandler(getMeController));

export default router;
