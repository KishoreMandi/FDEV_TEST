import Exam from "../models/Exam.js";
import Result from "../models/Result.js";
import Question from "../models/Question.js";
import mongoose from "mongoose";

/* ================= CREATE EXAM (ADMIN) ================= */
export const createExam = async (req, res) => {
  try {
    const { title, duration, negativeMarking, isPublished, startTime, endTime, attemptLimit, proctoring, assignedTo } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (isPublished) {
      return res.status(400).json({
        message: "You cannot publish the exam immediately because it has no questions. Please create the exam first, then add questions.",
      });
    }

    const exam = await Exam.create({
      title,
      duration: Number(duration),
      negativeMarking: Number(negativeMarking),
      isPublished: isPublished || false,
      startTime: startTime || null,
      endTime: endTime || null,
      attemptLimit: attemptLimit ? Number(attemptLimit) : 1,
      proctoring: proctoring || {},
      assignedTo: assignedTo || [],
      createdBy: req.user.id,
    });

    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL EXAMS (STUDENT/ADMIN) ================= */
export const getAllExams = async (req, res) => {
  try {
    const { role } = req.user;
    let query = {};
    
    // If student, only show published exams
    if (role === 'student') {
      query.isPublished = true;
      query.$or = [
        { assignedTo: { $exists: false } },
        { assignedTo: { $size: 0 } },
        { assignedTo: new mongoose.Types.ObjectId(req.user.id) }
      ];
    }

    const exams = await Exam.find(query)
      .sort({ createdAt: -1 })
      .select("-createdBy");
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/* UPDATE EXAM */
export const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { title, duration, negativeMarking, isPublished, startTime, endTime, attemptLimit, proctoring, assignedTo } = req.body;

    if (isPublished) {
      const questionCount = await Question.countDocuments({ examId });
      if (questionCount === 0) {
        return res.status(400).json({
          message: "Cannot publish exam with 0 questions. Please add questions first.",
        });
      }
    }

    const exam = await Exam.findByIdAndUpdate(
      examId,
      {
        title,
        duration: Number(duration),
        negativeMarking: Number(negativeMarking),
        isPublished,
        startTime,
        endTime,
        attemptLimit: Number(attemptLimit),
        proctoring,
        assignedTo,
      },
      { new: true }
    );

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* DELETE EXAM */
export const deleteExam = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await Exam.findByIdAndDelete(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.json({ message: "Exam deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const startExam = async (req, res) => {
  const { examId } = req.params;
  const studentId = req.user.id;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // 1. Check if published
    if (!exam.isPublished) {
      return res.status(403).json({ message: "Exam is not published yet" });
    }

    // 2. Check Time Window
    const now = new Date();
    if (exam.startTime && now < new Date(exam.startTime)) {
      return res.status(403).json({ message: "Exam has not started yet" });
    }
    if (exam.endTime && now > new Date(exam.endTime)) {
      return res.status(403).json({ message: "Exam has ended" });
    }

    // 3. Check Attempt Limits
    const attempts = await Result.countDocuments({
      examId,
      studentId,
      status: "submitted",
    });

    if (attempts >= (exam.attemptLimit || 1)) {
      return res.status(403).json({
        message: `Maximum attempts (${exam.attemptLimit || 1}) reached`,
      });
    }

    // allow start
    res.json({ message: "Exam allowed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const examData = async(req,res)=>{
  const { examId } = req.params;
  const existing = await Exam.findOne({_id:
    examId
  });
  res.json(existing);
}