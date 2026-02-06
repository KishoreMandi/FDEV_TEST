import mongoose from "mongoose";

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, // minutes
      required: true,
    },
    negativeMarking: {
      type: Number, // supports float like 0.25
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    attemptLimit: {
      type: Number,
      default: 1,
    },
    proctoring: {
      webcam: { type: Boolean, default: false },
      fullScreen: { type: Boolean, default: false },
      tabSwitch: { type: Boolean, default: false },
      screenRecording: { type: Boolean, default: false }, // New field
      tabSwitchLimit: { type: Number, default: 3 },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);
