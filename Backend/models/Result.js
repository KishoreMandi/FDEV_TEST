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
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
        selectedOption: Number, // For MCQ
        code: String, // For Coding
        language: String, // For Coding
        isCorrect: Boolean, // For Coding
        testCases: [
          {
            testCaseId: mongoose.Schema.Types.ObjectId,
            input: String,
            expectedOutput: String,
            actualOutput: String,
            passed: Boolean,
            error: String,
          }
        ],
      },
    ],
    markedForReview: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    activityLogs: [
      {
        type: { type: String }, // 'tab_switch', 'fullscreen_exit', 'copy_paste'
        timestamp: { type: Date, default: Date.now },
        message: String,
      }
    ],

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
    submissionType: {
      type: String,
      enum: ["manual", "auto"],
      default: "manual",
    },
    screenRecording: String, // Path to screen recording file
    webcamRecording: String, // Path to webcam recording file
  },
  { timestamps: true }
);


export default mongoose.model("Result", resultSchema);
