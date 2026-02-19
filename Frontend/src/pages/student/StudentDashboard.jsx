import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, 
  Clock, 
  CheckCircle, 
  RefreshCw,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Timer,
  Menu,
  X,
  ChevronRight,
  Bell,
  User,
  LogOut,
  LayoutDashboard,
  Mail,
  Hash,
  Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../../context/auth";
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
      
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
        user={user} 
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
        w-64 bg-slate-950 text-slate-100 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="px-6 py-5 border-b border-slate-800 relative">
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
              <span className="text-sm font-semibold tracking-tight text-white">
                SD
              </span>
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight text-white">
                Student
              </h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.16em]">
                Dashboard
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {[
            { id: 'all', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'pending', icon: BookOpen, label: 'My Exams' },
            { id: 'completed', icon: CheckCircle, label: 'History' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>


      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
        
        {/* HEADER */}
        <div className="bg-white border-b border-slate-200">
          <div className="px-6 py-4 flex justify-between items-center z-10 sticky top-0">
          <div className="flex items-center gap-3 md:gap-4">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
             >
               <Menu size={24} />
             </button>
            <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
              <img
                src="/F.log1.png"
                alt="Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
             <div>
                <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                  Student Dashboard
                </h2>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white font-semibold flex items-center justify-center">
                3
              </span>
            </button>

            <button 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-slate-900">
                  {user?.name}
                </p>
                <p className="text-xs text-slate-500">
                  Student
                </p>
              </div>
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 active:bg-rose-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
          </div>
        </div>

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



const ProfileModal = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
        {/* Header - Black and Gold */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-amber-500/20">
          <div className="flex items-center gap-3">
             <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
             <h2 className="text-xl font-bold text-white tracking-wide">Student Profile</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-slate-900 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6">
          {/* User Info - Centered or Left? Let's keep left but clean */}
          <div className="flex items-center gap-5 mb-8">
            <div className="w-20 h-20 rounded-full bg-slate-950 p-1 flex items-center justify-center border-2 border-amber-500 shadow-lg">
               <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-500">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
               </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{user?.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 uppercase tracking-wider border border-amber-200">
                  {user?.role}
                </span>
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Active"></span>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="space-y-4">
            {/* Email Card */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-500/50 transition-colors group">
              <div className="p-3 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-amber-500 transition-colors border border-slate-100">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 break-all">{user?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* ID Card */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-500/50 transition-colors group">
                <div className="p-2.5 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-amber-500 transition-colors border border-slate-100">
                  <Hash size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student ID</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{user?.employeeId}</p>
                </div>
              </div>

              {/* Dept Card */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-amber-500/50 transition-colors group">
                <div className="p-2.5 bg-white rounded-lg shadow-sm text-slate-400 group-hover:text-amber-500 transition-colors border border-slate-100">
                  <Briefcase size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Department</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{user?.department}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer/Decorative bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-slate-900 via-amber-500 to-slate-900"></div>
      </div>
    </div>
  );
};

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
               View Status
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
