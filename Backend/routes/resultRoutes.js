import express from "express";
import {
  submitExam,
  getMyResult,
  getAllResults,
  autoSaveAnswers,
  getSavedAttempt,
  getStudentExamStatus,
  getResultsByExam
} from "../controllers/resultController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// student
router.post("/submit", authMiddleware, submitExam);
router.get("/my/:examId", authMiddleware, getMyResult);

// admin
router.get("/all", authMiddleware, adminMiddleware, getAllResults);

router.patch(
  "/autosave",
  authMiddleware,
  autoSaveAnswers
);

router.get(
  "/resume/:examId",
  authMiddleware,
  getSavedAttempt
);

router.get(
  "/student/status",
  authMiddleware,
  getStudentExamStatus
);

// admin - results by exam
router.get(
  "/admin/:examId",
  authMiddleware,
  adminMiddleware,
  getResultsByExam
);
export default router;
