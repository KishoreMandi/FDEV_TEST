import express from "express";
import {
  addQuestion,
  getQuestionsByExam,
  getAdminQuestionsByExam,
  updateQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";
import { executeCode, executeCustomCode } from "../controllers/codeExecutionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import trainerMiddleware from "../middleware/trainerMiddleware.js";

const router = express.Router();

console.log("Loading Question Routes..."); // Debug log

router.post("/", authMiddleware, trainerMiddleware, addQuestion);
router.post("/execute", authMiddleware, executeCode);
router.post("/execute-custom", authMiddleware, executeCustomCode);
router.get("/admin/:examId", authMiddleware, trainerMiddleware, getAdminQuestionsByExam);
router.put("/:questionId", authMiddleware, trainerMiddleware, updateQuestion);
router.delete("/:questionId", authMiddleware, trainerMiddleware, deleteQuestion);
router.get("/:examId", authMiddleware, getQuestionsByExam);

export default router;
