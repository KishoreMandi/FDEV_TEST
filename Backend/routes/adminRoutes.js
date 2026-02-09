import express from "express";
import multer from "multer";
import { 
  getAdminStats, 
  getUsers, 
  approveUser,
  rejectUser,
  bulkImportUsers,
  updateUserRole,
  updateUserStatus,
  updateUserDepartment,
  updateUserDetails,
  deleteUser
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import trainerMiddleware from "../middleware/trainerMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.get("/stats", authMiddleware, trainerMiddleware, getAdminStats);
router.get("/users", authMiddleware, trainerMiddleware, getUsers);
router.put("/approve-user", authMiddleware, adminMiddleware, approveUser);
router.post("/reject-user", authMiddleware, adminMiddleware, rejectUser);

// User Governance Routes
router.post("/users/import", authMiddleware, adminMiddleware, upload.single("file"), bulkImportUsers);
router.put("/users/role", authMiddleware, adminMiddleware, updateUserRole);
router.put("/users/status", authMiddleware, adminMiddleware, updateUserStatus);
router.put("/users/department", authMiddleware, adminMiddleware, updateUserDepartment);
router.put("/users/details", authMiddleware, adminMiddleware, updateUserDetails);
router.delete("/users/delete", authMiddleware, adminMiddleware, deleteUser);

console.log("Admin routes initialized: /stats, /users, /approve-user, /users/import, /users/role, /users/status, /users/department, /users/details, /users/delete");

router.post("/test", (req, res) => {
  res.json({ ok: true, message: "admin POST test route working" });
});

export default router;
