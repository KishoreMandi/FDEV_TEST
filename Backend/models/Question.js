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
    type: {
      type: String,
      enum: ["mcq", "coding"],
      default: "mcq",
    },
    // MCQ specific fields
    options: {
      type: [String],
      validate: {
        validator: function(arr) {
          return this.type === "coding" || (arr && arr.length === 4);
        },
        message: "Exactly 4 options required for MCQ",
      },
    },
    correctOption: {
      type: Number, // index (0–3)
      required: function() {
        return this.type === "mcq";
      },
    },
    // Coding specific fields
    codingData: {
      language: {
        type: String,
        enum: ["javascript", "typescript", "python", "java", "cpp", "c", "csharp", "go", "rust", "php", "ruby", "kotlin"],
      },
      starterCode: String,
      testCases: [
        {
          input: String,
          expectedOutput: String,
          isHidden: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);
export default Question;
