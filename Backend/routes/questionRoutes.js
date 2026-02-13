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
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

console.log("Loading Question Routes..."); // Debug log

router.post("/", authMiddleware, adminMiddleware, addQuestion);
router.post("/execute", authMiddleware, executeCode);
router.post("/execute-custom", authMiddleware, executeCustomCode);
router.get("/admin/:examId", authMiddleware, adminMiddleware, getAdminQuestionsByExam);
router.put("/:questionId", authMiddleware, adminMiddleware, updateQuestion);
router.delete("/:questionId", authMiddleware, adminMiddleware, deleteQuestion);
router.get("/:examId", authMiddleware, getQuestionsByExam);

export default router;
