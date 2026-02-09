import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";



/* ================= REGISTER ================= */

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, department, employeeId } = req.body;

    // check existing user
    const existingUser = await User.findOne({ email });
    let existingEmployeeId = null;

    if (employeeId) {
      existingEmployeeId = await User.findOne({ employeeId });
    }

    if (existingUser && existingEmployeeId) {
      return res.status(400).json({ message: "Email and Employee ID already registered" });
    }

    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    if (existingEmployeeId) {
      return res.status(400).json({ message: "Employee ID already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine approval status
    // Admin is auto-approved, others need approval
    const isApproved = role === "admin";

    // create user
    const user = await User.create({
      name,
      email,
      employeeId,
      password: hashedPassword,
      role,
      isApproved,
      ...(role === "student" && { department }), // Conditionally add department
    });

    res.status(201).json({
      success: true,
      message: isApproved 
        ? "User registered successfully" 
        : "Registration successful! Please wait for admin approval.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= LOGIN ================= */

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // check approval status
    if (!user.isApproved) {
      return res.status(403).json({ message: "Account pending approval. Please contact admin." });
    }

    // check account status (suspended/banned)
    if (user.status !== "active") {
      return res.status(403).json({ message: `Account is ${user.status}. Please contact admin.` });
    }

    // generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
