import express from "express"
import dotenv from "dotenv"
import cors from "cors";
import connectDB from "./config/db.js"
import authRoutes from "./routes/authRoutes.js"
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import multer from "multer";
import { bulkImportUsers } from "./controllers/adminController.js";
import { seedDepartments } from "./controllers/departmentController.js"; // Import seed function
import authMiddleware from "./middleware/authMiddleware.js";
import adminMiddleware from "./middleware/adminMiddleware.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config()


const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

connectDB().then(() => {
  seedDepartments(); // Run seed after DB connection
});

app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/departments", departmentRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Online Exam Backend Running",
  });
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
