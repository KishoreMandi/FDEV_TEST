import express from "express";
import {
  submitExam,
  getMyResult,
  getAllResults,
  autoSaveAnswers,
  getSavedAttempt,
  getStudentExamStatus,
  getResultsByExam,
  getResultById,
  uploadRecording
} from "../controllers/resultController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// student
router.post("/submit", authMiddleware, submitExam);
router.post(
  "/upload-recording",
  authMiddleware,
  upload.fields([{ name: "screen" }, { name: "webcam" }]),
  uploadRecording
);
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

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getResultById
);

export default router;
