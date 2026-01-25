import express from "express";
import { getExamAnalytics } from "../controllers/analyticsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:examId", authMiddleware, getExamAnalytics);

export default router;
