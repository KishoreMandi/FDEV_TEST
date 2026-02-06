import express from "express";
import { getReports } from "../controllers/reportController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import trainerMiddleware from "../middleware/trainerMiddleware.js";

const router = express.Router();

// Allow admin and trainer to view reports
router.get("/", authMiddleware, trainerMiddleware, getReports);

export default router;
