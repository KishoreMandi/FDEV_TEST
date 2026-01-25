import Exam from "../models/Exam.js";
import User from "../models/User.js";
import Result from "../models/Result.js";

export const getAdminStats = async (req, res) => {
  try {
    const totalExams = await Exam.countDocuments();
    const totalStudents = await User.countDocuments({ role: "student" });
    const totalAttempts = await Result.countDocuments();

    const avgScoreAgg = await Result.aggregate([
      { $group: { _id: null, avgScore: { $avg: "$score" } } },
    ]);

    const avgScore = avgScoreAgg[0]?.avgScore
      ? Math.round(avgScoreAgg[0].avgScore * 10) / 10
      : 0;

    const recentExams = await Exam.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select("title createdAt");

    res.json({
      totalExams,
      totalStudents,
      totalAttempts,
      avgScore,
      recentExams,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
