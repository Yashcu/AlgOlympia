import express from "express";
import { Request, Response } from "express";

const router = express.Router();

router.get("/me", (req: Request, res: Response) => {
    res.json(req.user);
});

export default router;
