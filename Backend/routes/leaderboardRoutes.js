import express from "express";
import { getLiveLeaderboard } from "../controllers/leaderboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/live/:examId", authMiddleware, getLiveLeaderboard);

export default router;
