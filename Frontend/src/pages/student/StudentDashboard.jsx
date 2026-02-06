import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, CheckCircle, Lock, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import LogoutButton from "../../components/LogoutButton";
import SystemCheckModal from "../../components/SystemCheckModal";
import { getExams } from "../../api/examApi";
import { getStudentExamStatus } from "../../api/resultApi";

const Dashboard = () => {
  const [exams, setExams] = useState([]);
  const [attempted, setAttempted] = useState([]);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
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

  const handleStartExamClick = (exam) => {
    const now = new Date();
    const start = exam.startTime ? new Date(exam.startTime) : null;
    const end = exam.endTime ? new Date(exam.endTime) : null;

    if (start && now < start) {
      toast.error(`Exam starts at ${start.toLocaleString()}`);
      return;
    }

    if (end && now > end) {
      toast.error("Exam has ended");
      return;
    }

    setSelectedExamId(exam._id);
    setShowCheckModal(true);
  };

  const handleSystemCheckPass = () => {
    setShowCheckModal(false);
    if (selectedExamId) {
      navigate(`/student/exam/${selectedExamId}`);
    }
  };

  const completedCount = attempted.length;
  const pendingCount = exams.length - completedCount;

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <SystemCheckModal 
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        onConfirm={handleSystemCheckPass}
      />
      
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
      const now = new Date();
      const start = exam.startTime ? new Date(exam.startTime) : null;
      const end = exam.endTime ? new Date(exam.endTime) : null;
      
      let statusText = "Available";
      let statusColor = "text-blue-600";
      let isActionable = true;

      if (isCompleted) {
         statusText = "Completed";
         statusColor = "text-green-600";
         isActionable = false;
      } else if (start && now < start) {
         statusText = `Starts: ${start.toLocaleString()}`;
         statusColor = "text-orange-600";
         isActionable = false;
      } else if (end && now > end) {
         statusText = "Expired";
         statusColor = "text-red-600";
         isActionable = false;
      }

      return (
        <div
          key={exam._id}
          className="bg-white rounded-2xl shadow p-6 flex flex-col hover:shadow-lg transition"
        >
          <h3 className="text-lg font-bold mb-2">
            {exam.title}
          </h3>

          <div className="text-sm text-gray-500 flex items-center gap-2 mb-2">
            <Clock size={16} />
            {exam.duration} minutes
          </div>

          {start && (
             <div className="text-xs text-gray-500 flex items-center gap-2 mb-4">
                <Calendar size={14} />
                {start.toLocaleString()}
             </div>
          )}

          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full mb-4 w-fit bg-gray-100 ${statusColor}`}
          >
            {statusText}
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
              disabled={!isActionable && !start} 
              // We allow clicking "Starts: ..." to see the toast, or we can disable it. 
              // User asked for "give me the mesage like exam start in mention that time also"
              // The toast handles the click feedback, but visual disabled state helps too.
              // Let's keep it clickable if future/expired so they get the toast explanation, 
              // unless it's strictly better to disable. 
              // I'll make it look disabled if not actionable, but keep click handler for toast if needed, 
              // OR just rely on the card text.
              // Actually, standard UX: if it says "Starts: ...", user might click.
              // I'll style it differently.
              onClick={() => handleStartExamClick(exam)}
              className={`mt-auto py-2 rounded-lg font-semibold transition ${
                  !isActionable && statusText !== "Available" 
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {start && now < start ? "Scheduled" : "Start Exam"}
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
