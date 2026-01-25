import express from "express";
import { createExam, getAllExams,updateExam,deleteExam,startExam,examData } from "../controllers/examController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createExam);
router.get("/", authMiddleware, getAllExams);
/* UPDATE */
router.put(
  "/:examId",
  authMiddleware,
  adminMiddleware,
  updateExam
);

/* DELETE */
router.delete(
  "/:examId",
  authMiddleware,
  adminMiddleware,
  deleteExam
);

router.get(
  "/start/:examId",
  authMiddleware,
  startExam
);
router.get("/:examId",examData);

export default router;
