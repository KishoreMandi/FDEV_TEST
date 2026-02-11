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
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Timer,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import SystemCheckModal from "../../components/SystemCheckModal";
import { getExams } from "../../api/examApi";
import { getStudentExamStatus } from "../../api/resultApi";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [exams, setExams] = useState([]);
  const [attempted, setAttempted] = useState([]);
  const [showCheckModal, setShowCheckModal] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // Default to pending as it's most important
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
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

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  // Filter exams based on active tab
  const filteredExams = exams.filter(exam => {
    const isCompleted = attempted.includes(exam._id);
    if (activeTab === "all") return true;
    if (activeTab === "completed") return isCompleted;
    if (activeTab === "pending") return !isCompleted;
    return true;
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      <SystemCheckModal 
        open={showCheckModal}
        onClose={() => setShowCheckModal(false)}
        onConfirm={handleSystemCheckPass}
      />
      
      {/* MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-30
        w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="p-6 border-b border-slate-100 flex flex-col items-center relative">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 md:hidden"
          >
            <X size={20} />
          </button>
          <div className="relative mb-4 group">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl rotate-3 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform duration-300">
              {user?.name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-sm">
               <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
          </div>
          <h2 className="text-lg font-bold text-slate-800 text-center">{user?.name}</h2>
          <span className="px-3 py-1 mt-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-full uppercase tracking-wider">
            {user?.role}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">
              Profile Details
            </h3>
            <div className="space-y-1">
              <ProfileItem icon={<Mail size={16} />} label="Email" value={user?.email} />
              <ProfileItem icon={<Hash size={16} />} label="ID" value={user?.employeeId} />
              <ProfileItem icon={<Briefcase size={16} />} label="Dept" value={user?.department} />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100">
           <button 
             onClick={logout}
             className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 font-medium group"
           >
             <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
             Sign Out
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
        
        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-3 md:gap-4">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
             >
               <Menu size={24} />
             </button>
             <img 
               src="/F.log1.png" 
               alt="Logo" 
               className="w-12 h-12 object-contain hidden md:block mix-blend-multiply brightness-110 contrast-125" 
             />
             <div>
                <h1 className="text-xl font-bold text-slate-800">Student Dashboard</h1>
                <p className="text-xs text-slate-500 font-medium">Manage your exams and results</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">Current Time</span>
                <div className="flex items-center gap-2 text-slate-700 font-mono font-semibold">
                   <Clock size={16} className="text-indigo-500" />
                   <span>{currentTime.toLocaleTimeString()}</span>
                </div>
             </div>
             <button 
               onClick={loadData}
               disabled={loading}
               className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 border border-transparent hover:border-indigo-100"
               title="Refresh Data"
             >
               <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
             </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* STATS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Exams"
                value={exams.length}
                icon={<BookOpen size={24} />}
                color="indigo"
                trend="+2 new"
                trendColor="text-green-600"
              />
              <StatCard
                title="Completed"
                value={completedCount}
                icon={<CheckCircle size={24} />}
                color="emerald"
                trend="Great job!"
                trendColor="text-emerald-600"
              />
              <StatCard
                title="Pending"
                value={pendingCount}
                icon={<Timer size={24} />}
                color="amber"
                trend={pendingCount > 0 ? "Action needed" : "All clear"}
                trendColor={pendingCount > 0 ? "text-amber-600" : "text-slate-400"}
              />
            </div>

            {/* EXAMS SECTION */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  My Exams
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-semibold">
                    {exams.length}
                  </span>
                </h2>
                
                {/* TABS */}
                <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex shadow-sm">
                  {['all', 'pending', 'completed'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize
                        ${activeTab === tab 
                          ? 'bg-slate-800 text-white shadow-md' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }
                      `}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {filteredExams.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 border-dashed p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Filter size={24} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">No exams found</h3>
                  <p className="text-slate-500 text-sm">
                    {activeTab === 'all' 
                      ? "You haven't been assigned any exams yet." 
                      : `No ${activeTab} exams to show.`}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredExams.map((exam) => (
                    <ExamCard 
                      key={exam._id} 
                      exam={exam} 
                      isCompleted={attempted.includes(exam._id)}
                      currentTime={currentTime}
                      formatDate={formatDate}
                      getTimeRemaining={getTimeRemaining}
                      onStart={() => handleStartExamClick(exam)}
                      navigate={navigate}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

// Sub-components
const ProfileItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-default">
    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-sm transition-all">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">{label}</p>
      <p className="text-sm font-medium text-slate-700 truncate" title={value}>{value || "N/A"}</p>
    </div>
  </div>
);

const StatCard = ({ title, value, icon, color, trend, trendColor }) => {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${colors[color]} group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {trend && (
           <span className={`text-xs font-bold px-2 py-1 rounded-full bg-slate-50 ${trendColor}`}>
             {trend}
           </span>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-slate-800 mb-1">{value}</h3>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
      </div>
    </div>
  );
};

const ExamCard = ({ exam, isCompleted, currentTime, formatDate, getTimeRemaining, onStart, navigate }) => {
  const start = exam.startTime ? new Date(exam.startTime) : null;
  const end = exam.endTime ? new Date(exam.endTime) : null;
  
  let status = "available";
  if (isCompleted) status = "completed";
  else if (start && currentTime < start) status = "scheduled";
  else if (end && currentTime > end) status = "expired";

  const statusColors = {
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    scheduled: "bg-amber-100 text-amber-700 border-amber-200",
    expired: "bg-red-100 text-red-700 border-red-200",
    available: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };

  const statusIcons = {
    completed: <CheckCircle size={14} />,
    scheduled: <Clock size={14} />,
    expired: <AlertCircle size={14} />,
    available: <Timer size={14} />,
  };

  return (
    <div className={`
      relative bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col
      hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group
      ${status === 'completed' ? 'opacity-80 hover:opacity-100' : ''}
    `}>
      {/* Top Decoration */}
      <div className={`h-2 w-full ${
        status === 'available' ? 'bg-indigo-500' : 
        status === 'completed' ? 'bg-emerald-500' :
        status === 'scheduled' ? 'bg-amber-500' : 'bg-red-500'
      }`} />

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-4">
          <div className={`
            inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
            ${statusColors[status]}
          `}>
            {statusIcons[status]}
            <span className="capitalize">{status}</span>
          </div>
          <div className="text-slate-400 hover:text-indigo-600 cursor-pointer">
            <MoreVertical size={18} />
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {exam.title}
        </h3>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Clock size={16} className="text-slate-400" />
            <span>{exam.duration} mins duration</span>
          </div>
          {start && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar size={16} className="text-slate-400" />
              <span>{formatDate(start)}</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100">
          {status === "scheduled" ? (
             <div className="flex items-center justify-between bg-amber-50 rounded-lg p-3">
               <span className="text-xs font-bold text-amber-700 uppercase">Starts in</span>
               <span className="font-mono font-bold text-amber-600">{getTimeRemaining(start)}</span>
             </div>
          ) : status === "available" ? (
             <button
               onClick={onStart}
               className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
             >
               Start Exam <ChevronRight size={16} />
             </button>
          ) : status === "completed" ? (
             <button
               onClick={() => navigate(`/student/result/${exam._id}`)}
               className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 rounded-xl font-semibold transition-all"
             >
               View Results
             </button>
          ) : (
             <div className="w-full py-2.5 bg-slate-100 text-slate-400 rounded-xl font-semibold text-center text-sm cursor-not-allowed">
               Unavailable
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
