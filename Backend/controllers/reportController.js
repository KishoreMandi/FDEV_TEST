import Result from "../models/Result.js";
import User from "../models/User.js";
import Exam from "../models/Exam.js";

export const getReports = async (req, res) => {
  try {
    // 1. Department Performance (Ranking)
    const departmentStats = await Result.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "studentId",
          foreignField: "_id",
          as: "student",
        },
      },
      { $unwind: "$student" },
      {
        $group: {
          _id: "$student.department",
          avgScore: { $avg: "$accuracy" },
          totalAttempts: { $sum: 1 },
          highestScore: { $max: "$score" },
        },
      },
      { $sort: { avgScore: -1 } }, // Rank by average score
    ]);

    // 2. Exam Performance (Pass %, Avg Time)
    // Assuming pass mark is 50% of total questions * marks per question? 
    // Since we don't have total marks in Result directly (only score), 
    // and Exam doesn't have total marks explicitly defined (calculated from questions),
    // we will assume a pass threshold of 40% accuracy for now or just return raw stats.
    
    // First, let's get exam details to know total questions/marks if possible, 
    // but Result has 'accuracy' which is percentage. Let's use accuracy >= 50% as pass.
    
    const examStats = await Result.aggregate([
      {
        $lookup: {
          from: "exams",
          localField: "examId",
          foreignField: "_id",
          as: "exam",
        },
      },
      { $unwind: "$exam" },
      {
        $project: {
          examTitle: "$exam.title",
          accuracy: 1,
          timeSpent: { $subtract: ["$submittedAt", "$startedAt"] }, // in ms
          isPassed: { $gte: ["$accuracy", 50] }, // Assume 50% is pass
        },
      },
      {
        $group: {
          _id: "$examTitle",
          avgAccuracy: { $avg: "$accuracy" },
          avgTimeMs: { $avg: "$timeSpent" },
          totalAttempts: { $sum: 1 },
          passedCount: {
            $sum: { $cond: ["$isPassed", 1, 0] },
          },
        },
      },
      {
        $project: {
          examTitle: "$_id",
          avgScore: { $round: ["$avgAccuracy", 2] },
          avgTimeMinutes: { $round: [{ $divide: ["$avgTimeMs", 60000] }, 1] },
          passPercentage: {
            $round: [{ $multiply: [{ $divide: ["$passedCount", "$totalAttempts"] }, 100] }, 2],
          },
          totalAttempts: 1,
        },
      },
      { $sort: { totalAttempts: -1 } },
    ]);

    // 3. Audit History (Recent Activity)
    // Mocking audit history by combining recent creations
    const recentExams = await Exam.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "name email")
      .lean();
      
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email role department createdAt")
      .lean();

    const auditHistory = [
      ...recentExams.map(e => ({
        type: "Exam Created",
        description: `Exam '${e.title}' created by ${e.createdBy?.name || 'Unknown'}`,
        timestamp: e.createdAt,
        user: e.createdBy?.name || 'System'
      })),
      ...recentUsers.map(u => ({
        type: "User Registered",
        description: `User '${u.name}' joined (${u.role})`,
        timestamp: u.createdAt,
        user: u.name
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

    res.json({
      departmentStats,
      examStats,
      auditHistory
    });

  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ message: "Failed to generate reports" });
  }
};
