import Result from "../models/Result.js";
import Question from "../models/Question.js";

export const getExamAnalytics = async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user.id;

    const result = await Result.findOne({ examId, studentId });
    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    const totalQuestions = await Question.countDocuments({ examId });

    const attempted = result.answers.length;
    const correct = Math.round(result.score + attempted * 0); // logical
    const wrong = attempted - correct;
    const unattempted = totalQuestions - attempted;

    const accuracy = ((correct / totalQuestions) * 100).toFixed(2);

    const timeSpentMs =
      new Date(result.submittedAt) - new Date(result.startedAt);

    const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
    const timeSpentSeconds = Math.floor(
      (timeSpentMs % 60000) / 1000
    );

    res.json({
      examId,
      totalQuestions,
      attempted,
      correct,
      wrong,
      unattempted,
      score: result.score,
      accuracy: `${accuracy}%`,
      timeSpent: `${timeSpentMinutes}m ${timeSpentSeconds}s`,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  const { examId } = req.params;

  const result = await Result.findOne({
    examId,
    studentId: req.user.id,
    status: "submitted",
  });

  const timeSpentMs =
    new Date(result.submittedAt) -
    new Date(result.startedAt);

  const timeSpentMinutes = Math.floor(timeSpentMs / 60000);
  const timeSpentSeconds = Math.floor(
    (timeSpentMs % 60000) / 1000
  );

  res.json({
    score: result.score,
    correct: result.correct,
    wrong: result.wrong,
    unattempted: result.unattempted,
    accuracy: result.accuracy,
    timeSpent: `${timeSpentMinutes}m ${timeSpentSeconds}s`,
  });
};
