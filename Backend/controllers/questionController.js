import Question from "../models/Question.js";

import Exam from "../models/Exam.js";

/* ================= ADD QUESTION (ADMIN) ================= */
export const addQuestion = async (req, res) => {
  try {
    const { examId, question, options, correctOption, type, codingData } = req.body;

    // Check if exam is published
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (exam.isPublished) {
      return res.status(400).json({
        message: "Your exam is already published, unable to add questions",
      });
    }

    const newQuestion = await Question.create({
      examId,
      question,
      options,
      correctOption,
      type: type || "mcq",
      codingData,
    });

    res.status(201).json({
      success: true,
      newQuestion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET QUESTIONS BY EXAM (ADMIN) ================= */
export const getAdminQuestionsByExam = async (req, res) => {
  try {
    const questions = await Question.find({
      examId: req.params.examId,
    }); // Return everything including correctOption

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE QUESTION ================= */
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { question, options, correctOption, type, codingData } = req.body;

    const updatedQuestion = await Question.findByIdAndUpdate(
      questionId,
      { question, options, correctOption, type, codingData },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ success: true, updatedQuestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE QUESTION ================= */
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const deletedQuestion = await Question.findByIdAndDelete(questionId);

    if (!deletedQuestion) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET QUESTIONS BY EXAM ================= */
export const getQuestionsByExam = async (req, res) => {
  try {
    const questions = await Question.find({
      examId: req.params.examId,
    }).select("-correctOption"); // hide MCQ answer

    // Sanitize coding questions: remove hidden test cases' details
    const sanitizedQuestions = questions.map((q) => {
      if (q.type === "coding" && q.codingData && q.codingData.testCases) {
        const sanitizedTestCases = q.codingData.testCases.map((tc) => {
          if (tc.isHidden) {
            return {
              _id: tc._id,
              isHidden: true,
              // Do not send input or expectedOutput for hidden test cases
            };
          }
          return tc;
        });
        
        // Convert to plain object to modify
        const qObj = q.toObject();
        qObj.codingData.testCases = sanitizedTestCases;
        return qObj;
      }
      return q;
    });

    res.json(sanitizedQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
