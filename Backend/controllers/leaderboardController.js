import Result from "../models/Result.js";

export const getLiveLeaderboard = async (req, res) => {
  try {
    const { examId } = req.params;
    const currentStudentId = req.user.id;

    const results = await Result.find({ examId })
      .populate("studentId", "name")
      .sort({ score: -1, createdAt: 1 });

    let leaderboard = [];
    let rank = 1;

    results.forEach((result, index) => {
      if (index > 0 && result.score < results[index - 1].score) {
        rank = index + 1;
      }

      leaderboard.push({
        rank,
        name: result.studentId.name,
        score: result.score,
        isYou:
          result.studentId._id.toString() === currentStudentId,
      });
    });

    res.json({
      examId,
      updatedAt: new Date(),
      totalParticipants: leaderboard.length,
      leaderboard,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
