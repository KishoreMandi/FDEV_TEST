import express from "express";
import { createExam, getAllExams,updateExam,deleteExam,startExam,examData } from "../controllers/examController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import trainerMiddleware from "../middleware/trainerMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, trainerMiddleware, createExam);
router.get("/", authMiddleware, getAllExams);
/* UPDATE */
router.put(
  "/:examId",
  authMiddleware,
  trainerMiddleware,
  updateExam
);

/* DELETE */
router.delete(
  "/:examId",
  authMiddleware,
  trainerMiddleware,
  deleteExam
);

router.get(
  "/start/:examId",
  authMiddleware,
  startExam
);
router.get("/:examId",examData);

export default router;
