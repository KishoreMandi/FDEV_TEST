import Exam from "../models/Exam.js";
import User from "../models/User.js";
import Result from "../models/Result.js";
import bcrypt from "bcrypt";
import fs from "fs";
import csv from "csv-parser";

export const getAdminStats = async (req, res) => {
  try {
    const totalExams = await Exam.countDocuments();
    const totalStudents = await User.countDocuments({ role: { $in: ["student", "employee"] } });
    const totalAttempts = await Result.countDocuments();

    const avgScoreAgg = await Result.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$score" } } },
    ]);

    const avgScore = avgScoreAgg[0]?.avgScore
      ? Math.round(avgScoreAgg[0].avgScore * 10) / 10
      : 0;

    const recentExams = await Exam.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title createdAt");

    res.json({
      totalExams,
      totalStudents,
      totalAttempts,
      avgScore,
      recentExams,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isApproved = true;
    user.status = "active"; // Ensure status syncs with approval
    await user.save();

    res.json({ message: "User approved successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User rejected and removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= USER GOVERNANCE =================

// Update User Role
export const updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    if (!["admin", "employee", "student"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "User role updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Status (Suspend/Ban/Active)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId, status } = req.body;
    
    if (!["active", "suspended", "banned"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.status = status;
    // If suspended or banned, maybe revoke approval or keep it?
    // Let's keep isApproved as is, but login should check status too.
    
    await user.save();
    
    res.json({ message: `User status updated to ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Department
export const updateUserDepartment = async (req, res) => {
  try {
    const { userId, department } = req.body;
    
    const user = await User.findByIdAndUpdate(userId, { department }, { new: true });
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ message: "User department updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update User Details (Generic)
export const updateUserDetails = async (req, res) => {
  try {
    const { userId, name, email, role, department, employeeId } = req.body;
    
    // Trim inputs
    const trimmedEmail = email ? email.trim().toLowerCase() : undefined;
    const trimmedEmployeeId = employeeId ? employeeId.trim() : undefined;
    const trimmedDepartment = department ? department.trim() : undefined;
    const trimmedName = name ? name.trim() : undefined;

    // Check for duplicate email
    if (trimmedEmail) {
      const existingEmail = await User.findOne({ email: trimmedEmail, _id: { $ne: userId } });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Check for duplicate employeeId
    if (trimmedEmployeeId) {
       const existingId = await User.findOne({ employeeId: trimmedEmployeeId, _id: { $ne: userId } });
       if (existingId) {
         return res.status(400).json({ message: "Employee ID already exists" });
       }
    }

    const updates = {};
    if (trimmedName) updates.name = trimmedName;
    if (trimmedEmail) updates.email = trimmedEmail;
    if (role) updates.role = role;
    if (trimmedDepartment) updates.department = trimmedDepartment;
    
    // Allow updating employeeId (or unsetting it if empty string is sent)
    if (employeeId !== undefined) {
      updates.employeeId = trimmedEmployeeId || null;
    }

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User updated successfully", user });
  } catch (error) {
    // Check for MongoDB duplicate key error (code 11000) or message content
    if (error.code === 11000 || error.message.includes("E11000") || error.message.includes("duplicate key")) {
      return res.status(400).json({ message: "Duplicate key error: Email or ID already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Bulk Import Users via CSV
export const bulkImportUsers = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Please upload a CSV file" });
  }

  const results = [];
  const errors = [];
  
  fs.createReadStream(req.file.path)
    .pipe(csv({
      mapHeaders: ({ header }) => header.trim().toLowerCase()
    }))
    .on("data", (data) => results.push(data))
    .on("end", async () => {
      let successCount = 0;
      
      // Clean up file
      fs.unlinkSync(req.file.path);

      for (const row of results) {
        // Log row for debugging
        console.log("Processing CSV Row:", row);

        // Expected CSV headers: name, email, role, department, password (optional)
        // mapHeaders in csv() already handles lowercasing and trimming keys.
        
        const name = row.name;
        const email = row.email;
        let roleRaw = row.role;
        const department = row.department;
        const password = row.password;

        if (!name || !email) {
          console.log("Missing name or email for row:", row);
          errors.push({ email: email || "Unknown", message: "Missing name or email. Check CSV headers." });
          continue;
        }

        // Sanitize Role
        let role = "student";
        if (roleRaw) {
          const lower = roleRaw.toLowerCase().trim();
          if (["admin", "employee", "student"].includes(lower)) {
            role = lower;
          } else if (lower === "manager") {
            role = "admin"; // Map Manager to Admin
          }
        }

        try {
          const existingUser = await User.findOne({ email });
          if (existingUser) {
            errors.push({ email, message: "User already exists" });
            continue;
          }

          const plainPassword = password || "password123"; // Default password
          const hashedPassword = await bcrypt.hash(plainPassword, 10);

          await User.create({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            role,
            department: department ? department.trim() : "General",
            status: "active",
            isApproved: true, // Auto-approve imported users
          });

          successCount++;
        } catch (err) {
          errors.push({ email, message: err.message });
        }
      }

      res.json({
        message: "Bulk import processed",
        totalProcessed: results.length,
        successCount,
        errors,
      });
    });
};
