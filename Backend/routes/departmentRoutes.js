import express from "express";
import { getDepartments, addDepartment, deleteDepartment, updateDepartment } from "../controllers/departmentController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Public: Get all departments (needed for Registration)
router.get("/", getDepartments);

// Admin: Add/Update/Delete
router.post("/", authMiddleware, adminMiddleware, addDepartment);
router.put("/:id", authMiddleware, adminMiddleware, updateDepartment);
router.delete("/:id", authMiddleware, adminMiddleware, deleteDepartment);

export default router;
