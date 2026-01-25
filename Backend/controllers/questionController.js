import Question from "../models/Question.js";

/* ================= ADD QUESTION (ADMIN) ================= */
export const addQuestion = async (req, res) => {
  try {
    const { examId, question, options, correctOption } = req.body;

    const newQuestion = await Question.create({
      examId,
      question,
      options,
      correctOption,
    });

    res.status(201).json({
      success: true,
      newQuestion,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET QUESTIONS BY EXAM ================= */
export const getQuestionsByExam = async (req, res) => {
  try {
    const questions = await Question.find({
      examId: req.params.examId,
    }).select("-correctOption"); // hide answer

    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
