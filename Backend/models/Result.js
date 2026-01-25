import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
    },
    answers: Array,

    score: Number,
    correct: Number,
    wrong: Number,
    unattempted: Number,
    accuracy: Number,

    status: {
      type: String,
      enum: ["in-progress", "submitted"],
      default: "in-progress",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: Date,
  },
  { timestamps: true }
);


export default mongoose.model("Result", resultSchema);
