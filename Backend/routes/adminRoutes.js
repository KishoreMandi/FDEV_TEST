import express from "express";
import multer from "multer";
import { 
  getAdminStats, 
  getUsers, 
  approveUser,
  bulkImportUsers,
  updateUserRole,
  updateUserStatus,
  updateUserDepartment
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import trainerMiddleware from "../middleware/trainerMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/stats", authMiddleware, trainerMiddleware, getAdminStats);
router.get("/users", authMiddleware, adminMiddleware, getUsers);
router.put("/approve-user", authMiddleware, adminMiddleware, approveUser);

// User Governance Routes
router.post("/users/import", authMiddleware, adminMiddleware, upload.single("file"), bulkImportUsers);
router.put("/users/role", authMiddleware, adminMiddleware, updateUserRole);
router.put("/users/status", authMiddleware, adminMiddleware, updateUserStatus);
router.put("/users/department", authMiddleware, adminMiddleware, updateUserDepartment);

console.log("Admin routes initialized: /stats, /users, /approve-user, /users/import, /users/role, /users/status, /users/department");

router.post("/test", (req, res) => {
  res.json({ ok: true, message: "admin POST test route working" });
});

export default router;
