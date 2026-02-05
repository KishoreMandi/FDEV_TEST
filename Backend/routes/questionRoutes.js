import express from "express";
import {
  addQuestion,
  getQuestionsByExam,
} from "../controllers/questionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import trainerMiddleware from "../middleware/trainerMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, trainerMiddleware, addQuestion);
router.get("/:examId", authMiddleware, getQuestionsByExam);

export default router;
