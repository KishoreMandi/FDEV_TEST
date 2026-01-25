import express from "express";
import {
  addQuestion,
  getQuestionsByExam,
} from "../controllers/questionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, addQuestion);
router.get("/:examId", authMiddleware, getQuestionsByExam);

export default router;
