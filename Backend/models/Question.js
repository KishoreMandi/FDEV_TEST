import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      validate: [arr => arr.length === 4, "Exactly 4 options required"],
    },
    correctOption: {
      type: Number, // index (0–3)
      required: true,
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
