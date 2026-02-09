import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    employeeId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, 
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "trainer", "employee", "student"],
      default: "student",
    },
    department: {
      type: String,
      trim: true,
      default: "General",
    },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;

