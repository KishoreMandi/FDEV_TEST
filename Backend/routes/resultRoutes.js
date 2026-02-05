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
import trainerMiddleware from "../middleware/trainerMiddleware.js";

const router = express.Router();

// student
router.post("/submit", authMiddleware, submitExam);
router.get("/my/:examId", authMiddleware, getMyResult);

// admin & trainer
router.get("/all", authMiddleware, trainerMiddleware, getAllResults);

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

// admin & trainer - results by exam
router.get(
  "/admin/:examId",
  authMiddleware,
  trainerMiddleware,
  getResultsByExam
);
export default router;
