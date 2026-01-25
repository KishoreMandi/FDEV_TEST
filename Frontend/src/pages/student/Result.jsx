import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAnalytics } from "../../api/resultApi";
import toast from "react-hot-toast";

const Result = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalytics(examId)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load result"));
  }, [examId]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading result...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Exam Result
          </h1>
          <p className="text-gray-500">
            Here is your performance summary
          </p>
        </div>

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* SCORE */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
            <div>
              <p className="text-sm text-gray-500">Your Score</p>
              <h2 className="text-5xl font-bold text-blue-600">
                {data.score}
              </h2>
            </div>

            {/* ACCURACY BAR */}
            <div className="w-full md:w-1/2">
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">
                  Accuracy
                </span>
                <span className="text-sm font-semibold">
                  {data.accuracy}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all"
                  style={{ width: `${data.accuracy}%` }}
                />
              </div>
            </div>
          </div>

          {/* STATS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
              title="Correct"
              value={data.correct}
              color="green"
            />
            <StatCard
              title="Wrong"
              value={data.wrong}
              color="red"
            />
            <StatCard
              title="Unattempted"
              value={data.unattempted}
              color="gray"
            />
          </div>

          {/* TIME */}
          <div className="flex items-center justify-between border-t pt-4 text-gray-600">
            <span>Time Spent</span>
            <span className="font-medium">{data.timeSpent}</span>
          </div>

          {/* ACTIONS */}
          <div className="mt-8 flex flex-col md:flex-row gap-4">
            <button
              onClick={() =>
                navigate(`/student/leaderboard/${examId}`)
              }
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
            >
              View Leaderboard
            </button>

            <button
              onClick={() =>
                navigate("/student/dashboard")
              }
              className="flex-1 border border-gray-300 hover:bg-gray-100 py-3 rounded-lg font-semibold transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* 🔹 Reusable Stat Card */
const StatCard = ({ title, value, color }) => {
  const colors = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="rounded-xl p-6 bg-white shadow flex flex-col items-center">
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-full mb-3 ${colors[color]}`}
      >
        <span className="text-xl font-bold">
          {value}
        </span>
      </div>
      <p className="text-gray-600 font-medium">
        {title}
      </p>
    </div>
  );
};

export default Result;
