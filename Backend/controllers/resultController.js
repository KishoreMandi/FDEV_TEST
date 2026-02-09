import Result from "../models/Result.js";
import Question from "../models/Question.js";
import Exam from "../models/Exam.js";


/* ================= SUBMIT EXAM ================= */

export const submitExam = async (req, res) => {
  try {
    const { examId, answers } = req.body;
    const studentId = req.user.id;

    if (!examId || !answers) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const result = await Result.findOne({
      examId,
      studentId,
      status: "in-progress",
    });

    if (!result) {
      return res.status(400).json({
        message: "No active exam attempt found",
      });
    }

    let score = 0;
    let correct = 0;
    let wrong = 0;

    for (const ans of answers) {
      if (!ans.questionId) continue;

      const question = await Question.findById(ans.questionId);
      if (!question) continue;

      const selectedOpt = Number(ans.selectedOption);
      const isValidAttempt =
        ans.selectedOption !== null &&
        ans.selectedOption !== undefined &&
        ans.selectedOption !== "" &&
        !isNaN(selectedOpt);

      if (!isValidAttempt) continue;

      if (question.correctOption === selectedOpt) {
        score += 1;
        correct++;
      } else {
        score -= exam.negativeMarking || 0;
        wrong++;
      }
    }

    const totalQuestions = answers.length;
    const unattempted =
      totalQuestions - (correct + wrong);

    const accuracy =
      totalQuestions > 0
        ? Math.round((correct / totalQuestions) * 100)
        : 0;

    result.answers = answers;
    result.score = score;
    result.correct = correct;
    result.wrong = wrong;
    result.unattempted = unattempted;
    result.accuracy = accuracy;
    result.status = "submitted";
    result.submittedAt = new Date();

    await result.save();

    res.json({
      success: true,
      message: "Exam submitted successfully",
    });
  } catch (error) {
    console.error("SUBMIT ERROR:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};



/* ================= GET STUDENT RESULT ================= */
export const getMyResult = async (req, res) => {
  try {
    const { examId } = req.params;

    const result = await Result.findOne({
      studentId: req.user.id,
      examId,
    }).populate("examId", "title duration");

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= ADMIN: ALL RESULTS ================= */
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("studentId", "name email")
      .populate("examId", "title");

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPLOAD RECORDING ================= */
export const uploadRecording = async (req, res) => {
  try {
    const { examId } = req.body;
    const studentId = req.user.id;

    if (!req.files || (!req.files.screen && !req.files.webcam)) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Try to find in-progress result first
    let result = await Result.findOne({
      examId,
      studentId,
      status: "in-progress",
    });

    // If not found, check for recently submitted (in case of race condition or late upload)
    if (!result) {
      result = await Result.findOne({
        examId,
        studentId,
        status: "submitted",
      }).sort({ submittedAt: -1 });
    }

    if (!result) {
      return res.status(404).json({ message: "No exam attempt found" });
    }

    if (req.files.screen) {
      result.screenRecording = req.files.screen[0].path.replace(/\\/g, "/");
    }
    if (req.files.webcam) {
      result.webcamRecording = req.files.webcam[0].path.replace(/\\/g, "/");
    }

    await result.save();

    res.json({ success: true, message: "Recordings uploaded successfully" });
  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};


export const autoSaveAnswers = async (req, res) => {
  try {
    const { examId, answers, activityLogs, markedForReview } = req.body;
    const studentId = req.user.id;

    // 1. Check if exam is already submitted (prevent ghost upserts)
    const alreadySubmitted = await Result.findOne({
      examId,
      studentId,
      status: "submitted",
    });

    if (alreadySubmitted) {
      return res.json({
        success: true,
        message: "Exam already submitted. Auto-save ignored.",
      });
    }

    const attempt = await Result.findOneAndUpdate(
      { examId, studentId, status: "in-progress" },
      { answers, activityLogs, markedForReview },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Answers auto-saved",
      savedAt: new Date(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSavedAttempt = async (req, res) => {
  const { examId } = req.params;

  const attempt = await Result.findOne({
    examId,
    studentId: req.user.id,
  });

  res.json(attempt || null);
};


export const getStudentExamStatus = async (req, res) => {
  const studentId = req.user.id;

  const results = await Result.find({
    studentId,
    status: "submitted",
  }).select("examId");

  const attemptedExamIds = results.map(
    (r) => r.examId.toString()
  );

  res.json({ attemptedExamIds });
};
export const getResultsByExam = async (req, res) => {
  const { examId } = req.params;

  const results = await Result.find({ examId })
    .populate("studentId", "name email employeeId")
    .populate({
      path: "answers.questionId",
      // Remove select to fetch all fields to avoid missing data issues
    })
    .sort({ score: -1 });

  res.json(results);
};

/* ================= GET SINGLE RESULT BY ID ================= */
export const getResultById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Result.findById(id)
      .populate("studentId", "name email employeeId")
      .populate({
        path: "answers.questionId",
        // No select restriction, get everything
      });

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
