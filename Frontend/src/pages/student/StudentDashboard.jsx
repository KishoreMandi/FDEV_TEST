import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, CheckCircle, Lock } from "lucide-react";
import LogoutButton from "../../components/LogoutButton";
import { getExams } from "../../api/examApi";
import { getStudentExamStatus } from "../../api/resultApi";

const Dashboard = () => {
  const [exams, setExams] = useState([]);
  const [attempted, setAttempted] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const examsRes = await getExams();
    const statusRes = await getStudentExamStatus();

    setExams(examsRes.data);
    setAttempted(statusRes.data.attemptedExamIds);
  };

  const completedCount = attempted.length;
  const pendingCount = exams.length - completedCount;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
 <div> <h1 className="text-3xl font-bold">Student Dashboard</h1>
  <p className="text-gray-500">
            Track your exams and results
          </p></div>
  <LogoutButton />
</div>
          
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Total Exams"
            value={exams.length}
            icon={<BookOpen />}
            color="blue"
          />
          <StatCard
            title="Completed"
            value={completedCount}
            icon={<CheckCircle />}
            color="green"
          />
          <StatCard
            title="Pending"
            value={pendingCount}
            icon={<Clock />}
            color="orange"
          />
        </div>

        {/* EXAMS */}
        <h2 className="text-xl font-semibold mb-4">
          Exams
        </h2>

        
          {exams.length === 0 ? (
  <div className="bg-white rounded-2xl shadow p-10 flex flex-col items-center justify-center text-center">
    <BookOpen size={48} className="text-gray-400 mb-4" />
    <h3 className="text-lg font-semibold text-gray-700">
      No Exams Available
    </h3>
    <p className="text-gray-500 mt-2">
      Please check back later. New exams will appear here.
    </p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {exams.map((exam) => {
      const isCompleted = attempted.includes(exam._id);

      return (
        <div
          key={exam._id}
          className="bg-white rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition"
        >
          <h3 className="text-lg font-bold mb-2">
            {exam.title}
          </h3>

          <div className="text-sm text-gray-500 flex items-center gap-2 mb-4">
            <Clock size={16} />
            {exam.duration} minutes
          </div>

          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit ${
              isCompleted
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isCompleted ? "Completed" : "Pending"}
          </span>

          {isCompleted ? (
            <button
              onClick={() =>
                navigate(`/student/result/${exam._id}`)
              }
              className="mt-auto bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition"
            >
              View Result
            </button>
          ) : (
            <button
              onClick={() =>
                navigate(`/student/exam/${exam._id}`)
              }
              className="mt-auto bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
            >
              Start Exam
            </button>
          )}
        </div>
      );
    })}
  </div>
)}
        </div>
      </div>
    
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    orange: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-full ${colors[color]}`}
      >
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm">
          {title}
        </p>
        <h3 className="text-2xl font-bold">
          {value}
        </h3>
      </div>
    </div>
  );
};

export default Dashboard;
