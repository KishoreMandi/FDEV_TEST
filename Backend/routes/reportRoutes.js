import express from "express";
import { getReports } from "../controllers/reportController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Allow admin to view reports
router.get("/", authMiddleware, adminMiddleware, getReports);

export default router;
