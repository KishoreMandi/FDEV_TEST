import Result from "../models/Result.js";
import Question from "../models/Question.js";
import Exam from "../models/Exam.js";


/* ================= SUBMIT EXAM ================= */

export const submitExam = async (req, res) => {
  try {
    const { examId, answers, submissionType, markedForReview, activityLogs } = req.body;
    const studentId = req.user.id;

    if (!examId || !answers) {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    let result = await Result.findOne({
      examId,
      studentId,
      status: "in-progress",
    });

    // If no in-progress attempt, check if already submitted
    if (!result) {
      const alreadySubmitted = await Result.findOne({
        examId,
        studentId,
        status: "submitted",
      });

      if (alreadySubmitted) {
        return res.json({
          success: true,
          message: "Exam already submitted",
          score: alreadySubmitted.score,
        });
      }

      // If neither, create a new one (shouldn't happen often if auto-save is working)
      result = new Result({
        examId,
        studentId,
        status: "in-progress",
        startedAt: new Date(),
      });
    }

    let score = 0;
    let correct = 0;
    let wrong = 0;

    for (const ans of answers) {
      if (!ans.questionId) continue;

      const question = await Question.findById(ans.questionId);
      if (!question) continue;

      if (question.type === "mcq") {
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
      } else if (question.type === "coding") {
        if (ans.code && ans.isCorrect) {
          score += 1;
          correct++;
        } else if (ans.code) {
          wrong++;
        }
      }
    }

    const totalQuestions = await Question.countDocuments({ examId });
    const unattempted = totalQuestions - (correct + wrong);

    result.answers = answers;
    result.score = score;
    result.correct = correct;
    result.wrong = wrong;
    result.unattempted = unattempted;
    result.accuracy = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;
    result.status = "submitted";
    result.submittedAt = new Date();
    result.submissionType = submissionType || "manual";
    
    // Also save these in case they weren't auto-saved recently
    if (markedForReview) result.markedForReview = markedForReview;
    if (activityLogs) result.activityLogs = activityLogs;

    await result.save();

    res.json({
      success: true,
      message: submissionType === "auto" ? "Exam auto-submitted" : "Exam submitted successfully",
      score,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Process answers to ensure selectedOption is a Number for MCQs
    const questionIds = answers.map(ans => ans.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).select('type');
    const questionTypeMap = new Map(questions.map(q => [q._id.toString(), q.type]));

    const processedAnswers = answers.map(ans => {
      const questionType = questionTypeMap.get(ans.questionId.toString());
      if (questionType === "mcq" && ans.selectedOption !== null && ans.selectedOption !== undefined && ans.selectedOption !== "") {
        return { ...ans, selectedOption: Number(ans.selectedOption) };
      }
      return ans;
    });

    const attempt = await Result.findOneAndUpdate(
      { examId, studentId, status: "in-progress" },
      { answers: processedAnswers, activityLogs, markedForReview },
      { upsert: true, new: true, setDefaultsOnInsert: true }
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
    })
    .sort({ score: -1, status: 1 }); // Sort by score and then status (submitted first)

  // FILTER: Keep only one result per student
  // If multiple results exist, prefer 'submitted' over 'in-progress'
  const filteredResults = [];
  const studentMap = new Map();

  results.forEach(res => {
    const studentIdStr = res.studentId?._id?.toString() || res.studentId?.toString();
    if (!studentIdStr) return;

    if (!studentMap.has(studentIdStr)) {
      studentMap.set(studentIdStr, res);
      filteredResults.push(res);
    } else {
      // If we already have a result for this student, check if the current one is 'submitted'
      // while the stored one is 'in-progress'. If so, replace it.
      const existingRes = studentMap.get(studentIdStr);
      if (existingRes.status === 'in-progress' && res.status === 'submitted') {
        // Find index of existing result and replace it
        const index = filteredResults.findIndex(r => (r.studentId?._id?.toString() || r.studentId?.toString()) === studentIdStr);
        if (index !== -1) {
          filteredResults[index] = res;
          studentMap.set(studentIdStr, res);
        }
      }
    }
  });

  res.json(filteredResults);
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
