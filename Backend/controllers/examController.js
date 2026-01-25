import Exam from "../models/Exam.js";

/* ================= CREATE EXAM (ADMIN) ================= */
export const createExam = async (req, res) => {
  try {
    const { title, duration, negativeMarking } = req.body;

    if (!title || !duration) {
      return res.status(400).json({ message: "All fields required" });
    }

    const exam = await Exam.create({
      title,
      duration: Number(duration),
      negativeMarking: Number(negativeMarking), // 👈 important
      createdBy: req.user.id,
    });

    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL EXAMS (STUDENT) ================= */
export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().select("-createdBy");
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/* UPDATE EXAM */
export const updateExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const { title, duration, negativeMarking } = req.body;

    const exam = await Exam.findByIdAndUpdate(
      examId,
      {
        title,
        duration: Number(duration),
        negativeMarking: Number(negativeMarking),
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

  const existing = await Result.findOne({
    examId,
    studentId,
    status: "submitted",
  });

  if (existing) {
    return res.status(403).json({
      message: "You have already attempted this exam",
    });
  }

  // allow start
  res.json({ message: "Exam allowed" });
};

export const examData = async(req,res)=>{
  const { examId } = req.params;
  const existing = await Exam.findOne({_id:
    examId
  });
  res.json(existing);
}