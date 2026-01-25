import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { getLeaderboard } from "../../api/leaderboardApi";
import Leaderboard from "../../components/Leaderboard";

const StudentLeaderboard = () => {
  const { examId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await getLeaderboard(examId);
        setLeaderboard(res.data.leaderboard);
      } catch {
        toast.error("Failed to load leaderboard");
      }
    };

    fetchLeaderboard();

    // 🔁 Live polling (every 10 sec)
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [examId]);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Leaderboard data={leaderboard} />
    </div>
  );
};

export default StudentLeaderboard;
