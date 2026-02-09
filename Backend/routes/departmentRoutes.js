import express from "express";
import { getDepartments, addDepartment, deleteDepartment } from "../controllers/departmentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public: Get all departments (needed for Registration)
router.get("/", getDepartments);

// Admin: Add/Delete
router.post("/", authMiddleware, adminMiddleware, addDepartment);
router.delete("/:id", authMiddleware, adminMiddleware, deleteDepartment);

export default router;
