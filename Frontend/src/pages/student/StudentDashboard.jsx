import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  User as UserIcon, 
  Mail, 
  Briefcase, 
  Hash, 
  LogOut,
  RefreshCw,
  Calendar,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext"; // Import useAuth
import SystemCheckModal from "../../components/SystemCheckModal";
import { getExams } from "../../api/examApi";
import { getStudentExamStatus } from "../../api/resultApi";

const Dashboard = () => {
  const { user, logout } = useAuth(); // Get user details
  const [exams, setExams] = useState([]);
  const [attempted, setAttempted] = useState([]);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Auto-refresh data every 30 seconds to keep sync with server
    const dataTimer = setInterval(loadData, 30000);

    return () => {
      clearInterval(timer);
      clearInterval(dataTimer);
    };
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [examsRes, statusRes] = await Promise.all([
        getExams(),
        getStudentExamStatus()
      ]);
      setExams(examsRes.data);
      setAttempted(statusRes.data.attemptedExamIds);
    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setLoading(false);
    }
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

  // Format date helper
  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time remaining string
  const getTimeRemaining = (targetDate) => {
    const total = Date.parse(targetDate) - Date.parse(currentTime);
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <SystemCheckModal 
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        onConfirm={handleSystemCheckPass}
      />
      
      {/* SIDEBAR - PROFILE SECTION */}
      <aside className="w-80 bg-white shadow-2xl flex flex-col z-10 hidden md:flex">
        <div className="p-8 flex flex-col items-center border-b border-gray-100">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <h2 className="text-xl font-bold text-gray-800 text-center">{user?.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{user?.role?.toUpperCase()}</p>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Profile Details
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                <Mail size={16} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm font-medium truncate" title={user?.email}>{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition">
              <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                <Hash size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Employee ID</p>
                <p className="text-sm font-medium">{user?.employeeId || "N/A"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition">
              <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <Briefcase size={16} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Department</p>
                <p className="text-sm font-medium">{user?.department || "General"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100">
           <button 
             onClick={logout}
             className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-xl font-semibold hover:bg-red-100 transition duration-200"
           >
             <LogOut size={18} />
             Sign Out
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP BAR */}
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500">Welcome back, ready for your exams?</p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg text-gray-600 font-medium">
                <Clock size={18} />
                <span>{currentTime.toLocaleTimeString()}</span>
             </div>
             <button 
               onClick={loadData}
               disabled={loading}
               className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
               title="Refresh Data"
             >
               <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
             </button>
             {/* Mobile Menu Button could go here */}
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatCard
              title="Total Exams"
              value={exams.length}
              icon={<BookOpen size={24} />}
              color="blue"
              subtext="Assigned to you"
            />
            <StatCard
              title="Completed"
              value={completedCount}
              icon={<CheckCircle size={24} />}
              color="green"
              subtext="Successfully finished"
            />
            <StatCard
              title="Pending"
              value={pendingCount}
              icon={<Clock size={24} />}
              color="orange"
              subtext="Waiting for action"
            />
          </div>

          {/* EXAMS SECTION */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <BookOpen className="text-blue-600" />
              Your Exams
            </h2>
            <span className="text-sm text-gray-500">
              {pendingCount} Pending
            </span>
          </div>

          {exams.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <BookOpen size={32} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Exams Assigned</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                You're all caught up! Check back later for new exam assignments.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-8">
              {exams.map((exam) => {
                const isCompleted = attempted.includes(exam._id);
                const now = currentTime;
                const start = exam.startTime ? new Date(exam.startTime) : null;
                const end = exam.endTime ? new Date(exam.endTime) : null;
                
                let status = "available"; // available, scheduled, expired, completed
                
                if (isCompleted) status = "completed";
                else if (start && now < start) status = "scheduled";
                else if (end && now > end) status = "expired";

                return (
                  <div
                    key={exam._id}
                    className={`
                      relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 
                      hover:shadow-xl transition-all duration-300 flex flex-col group
                      ${status === "completed" ? "opacity-75 bg-gray-50" : ""}
                    `}
                  >
                    {/* Status Badge */}
                    <div className="absolute top-6 right-6">
                      {status === "completed" && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle size={12} /> Completed
                        </span>
                      )}
                      {status === "scheduled" && (
                        <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          <Clock size={12} /> Scheduled
                        </span>
                      )}
                      {status === "expired" && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                          <AlertCircle size={12} /> Expired
                        </span>
                      )}
                      {status === "available" && (
                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle size={12} /> Available
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="mb-4 pr-20">
                      <h3 className="text-lg font-bold text-gray-800 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                        {exam.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                           <Clock size={14} /> {exam.duration} min
                        </div>
                        {start && (
                          <div className="flex items-center gap-1">
                             <Calendar size={14} /> {formatDate(start)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Dynamic Countdown / Info Area */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 mt-auto">
                       {status === "scheduled" ? (
                         <div className="text-center">
                           <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-1">Starts In</p>
                           <p className="text-2xl font-mono font-bold text-orange-600">
                             {getTimeRemaining(start)}
                           </p>
                         </div>
                       ) : status === "available" ? (
                         <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Ready to take?</span>
                            <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">Action Required</span>
                         </div>
                       ) : status === "completed" ? (
                         <div className="text-center text-gray-500 text-sm">
                           You have completed this exam.
                         </div>
                       ) : (
                         <div className="text-center text-red-500 text-sm font-medium">
                           This exam is no longer available.
                         </div>
                       )}
                    </div>

                    {/* Action Button */}
                    {status === "completed" ? (
                       <button
                         onClick={() => navigate(`/student/result/${exam._id}`)}
                         className="w-full py-3 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
                       >
                         View Result Status
                       </button>
                    ) : (
                       <button
                         onClick={() => handleStartExamClick(exam)}
                         disabled={status === "expired" || (status === "scheduled" && false)} 
                         // Keep scheduled clickable to show toast details, or disable if preferred. 
                         // User requested detailed messages, so keeping clickable is good, but visual indication is handled by disabled style below if needed.
                         // Actually, let's make the button distinct for Scheduled
                         className={`
                           w-full py-3 rounded-xl font-bold text-white shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0
                           ${status === "available" 
                              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-200" 
                              : status === "scheduled"
                                ? "bg-gray-400 cursor-not-allowed" // Visually disabled but we might want click for toast
                                : "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                           }
                         `}
                       >
                         {status === "available" ? "Start Exam Now" : 
                          status === "scheduled" ? "Wait for Start" : "Unavailable"}
                       </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, subtext }) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${colorStyles[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-500 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold text-gray-800 my-1">{value}</h3>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
      </div>
    </div>
  );
};

export default Dashboard;
