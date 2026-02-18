import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import axios from "../../api/axiosInstance";
import { getDepartments } from "../../api/departmentApi";
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  Users, 
  Calendar, 
  Shield, 
  Camera, 
  Maximize, 
  Monitor, 
  ToggleLeft,
  UserCheck,
  ArrowRight,
  Sparkles,
  Building,
  Hash,
  Timer,
  Eye,
  Settings,
  CheckCircle2
} from "lucide-react";

const CreateExam = () => {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [negativeMarking, setNegativeMarking] = useState("0");
  const [isPublished, setIsPublished] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [proctoring, setProctoring] = useState({
    webcam: false,
    fullScreen: false,
    tabSwitch: false,
    screenRecording: false,
    multiplePersonDetection: false,
    tabSwitchLimit: 3,
  });
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [loading, setLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins > 0) {
        setDuration(diffMins);
      } else {
        setDuration("");
      }
    }
  }, [startTime, endTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !duration) {
      toast.error("Please fill all fields");
      return;
    }

    if (isPublished) {
      toast.error(
        "You cannot publish the exam immediately because it has no questions. Please create the exam first, then add questions."
      );
      return;
    }

    try {
      setLoading(true);

      await axios.post("/exams", {
        title,
        duration,
        negativeMarking,
        isPublished,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
        attemptLimit,
        proctoring,
        department: selectedDepartment,
      });

      toast.success(`Exam created successfully for '${selectedDepartment}' (Draft)`);

      setTitle("");
      setDuration("");
      setNegativeMarking("0");
      setIsPublished(false);
      setStartTime("");
      setEndTime("");
      setAttemptLimit(1);
      setSelectedDepartment("All");
      setProctoring({
        webcam: false,
        fullScreen: false,
        tabSwitch: false,
        screenRecording: false,
        multiplePersonDetection: false,
        tabSwitchLimit: 3,
      });
    } catch (error) {
      console.error("Create Exam Error:", error);
      let message = "Failed to create exam";
      
      if (error.response) {
        message = error.response.data.message || message;
      } else if (error.request) {
        message = "Server unreachable. Please check your connection.";
      } else {
        message = error.message;
      }
      
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const proctoringOptions = [
    { key: 'webcam', label: 'Webcam Capture', description: 'Capture photos during exam', icon: Camera, color: 'pink' },
    { key: 'fullScreen', label: 'Force Fullscreen', description: 'Prevent window minimization', icon: Maximize, color: 'purple' },
    { key: 'screenRecording', label: 'Screen Recording', description: 'Record screen activity', icon: Monitor, color: 'blue' },
    { key: 'tabSwitch', label: 'Tab Switch Detection', description: 'Detect tab switches', icon: ToggleLeft, color: 'pink' },
    { key: 'multiplePersonDetection', label: 'Multi-Person Detection', description: 'Detect multiple faces', icon: UserCheck, color: 'purple' },
  ];

  const colorMap = {
    pink: {
      gradient: "from-pink-500 to-rose-500",
      bg: "from-pink-50 to-rose-50",
      border: "border-pink-200",
      text: "text-pink-600",
      shadow: "shadow-pink-500/20",
      check: "accent-pink-500"
    },
    purple: {
      gradient: "from-purple-500 to-indigo-500",
      bg: "from-purple-50 to-indigo-50",
      border: "border-purple-200",
      text: "text-purple-600",
      shadow: "shadow-purple-500/20",
      check: "accent-purple-500"
    },
    blue: {
      gradient: "from-blue-500 to-cyan-500",
      bg: "from-blue-50 to-cyan-50",
      border: "border-blue-200",
      text: "text-blue-600",
      shadow: "shadow-blue-500/20",
      check: "accent-blue-500"
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="ml-64 w-full min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-pink-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-bl from-purple-200/20 to-blue-200/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <AdminHeader />

        <div className="relative p-6 max-w-4xl mx-auto">
          {/* Header Section */}
          <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <div className="flex items-center gap-4 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative p-3 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl shadow-xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Create New Exam
                  </span>
                </h2>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  Configure your exam settings and proctoring options
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information Card */}
            <div className={`relative group transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
              
              <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-2xl shadow-xl border border-purple-100/50 overflow-hidden">
                {/* Card Header */}
                <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-white to-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg shadow-purple-500/20">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                        Basic Information
                      </h3>
                      <p className="text-xs text-gray-500">Enter exam details and schedule</p>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Exam Title */}
                    <div className="md:col-span-2 group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        Exam Title
                      </label>
                      <input
                        placeholder="Enter exam title..."
                        className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    {/* Duration */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Timer className="w-4 h-4 text-purple-500" />
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 60"
                        className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                      />
                    </div>

                    {/* Attempt Limit */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Hash className="w-4 h-4 text-purple-500" />
                        Attempt Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
                        value={attemptLimit}
                        onChange={(e) => setAttemptLimit(e.target.value)}
                      />
                    </div>

                    {/* Negative Marking */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        Negative Marking
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="e.g. 0.25"
                        className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
                        value={negativeMarking}
                        onChange={(e) => setNegativeMarking(e.target.value)}
                      />
                    </div>

                    {/* Department */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Building className="w-4 h-4 text-purple-500" />
                        Department
                      </label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                      >
                        <option value="All">All Departments</option>
                        {departments.map((dept) => (
                          <option key={dept._id} value={dept.name}>
                            {dept.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Date/Time Section */}
                  <div className="pt-4 border-t border-purple-100">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-gray-700">Schedule (Optional)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Time</label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">End Time</label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proctoring Settings Card */}
            <div className={`relative group transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
              
              <div className="relative bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden">
                {/* Card Header */}
                <div className="p-5 border-b border-blue-100 bg-gradient-to-r from-white to-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-blue-500/20">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-blue-700 to-purple-700 bg-clip-text text-transparent">
                        Proctoring & Monitoring
                      </h3>
                      <p className="text-xs text-gray-500">Configure security and monitoring options</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 border border-blue-200">
                      <Eye className="w-3 h-3 text-purple-500" />
                      <span className="text-xs font-medium text-purple-600">Advanced</span>
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proctoringOptions.map((option, index) => {
                      const Icon = option.icon;
                      const colors = colorMap[option.color];
                      const isChecked = proctoring[option.key];
                      
                      return (
                        <label 
                          key={option.key}
                          className={`relative group/item cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                            isChecked 
                              ? `bg-gradient-to-br ${colors.bg} ${colors.border} shadow-lg ${colors.shadow}` 
                              : 'bg-white border-gray-200 hover:border-purple-300'
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Checkbox */}
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => setProctoring({ ...proctoring, [option.key]: e.target.checked })}
                            className="sr-only"
                          />
                          
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`p-2 rounded-lg transition-all duration-300 ${
                              isChecked 
                                ? `bg-gradient-to-br ${colors.gradient} shadow-lg` 
                                : 'bg-gray-100'
                            }`}>
                              <Icon className={`w-5 h-5 transition-colors ${isChecked ? 'text-white' : 'text-gray-400'}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium transition-colors ${isChecked ? colors.text : 'text-gray-700'}`}>
                                  {option.label}
                                </span>
                                {isChecked && (
                                  <CheckCircle2 className={`w-4 h-4 ${colors.text}`} />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                            </div>

                            {/* Toggle indicator */}
                            <div className={`w-10 h-6 rounded-full transition-all duration-300 ${
                              isChecked 
                                ? `bg-gradient-to-r ${colors.gradient}` 
                                : 'bg-gray-200'
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-0.5 ${
                                isChecked ? 'translate-x-4.5 ml-0.5' : 'translate-x-0.5'
                              }`} />
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {/* Tab Switch Limit */}
                  {proctoring.tabSwitch && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 animate-fade-in-up">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700">Maximum Tab Switch Violations</label>
                          <p className="text-xs text-gray-500">Exam will auto-submit after this limit</p>
                        </div>
                        <input
                          type="number"
                          min="1"
                          className="w-20 px-3 py-2 rounded-lg border border-pink-200 bg-white focus:border-pink-400 focus:ring-2 focus:ring-pink-200/50 focus:outline-none text-center font-medium"
                          value={proctoring.tabSwitchLimit}
                          onChange={(e) => setProctoring({ ...proctoring, tabSwitchLimit: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className={`relative group transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
              <button
                type="submit"
                disabled={loading}
                className={`relative w-full overflow-hidden px-8 py-4 rounded-2xl font-semibold text-white transition-all duration-300 transform ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {/* Button shimmer */}
                {!loading && (
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                )}
                
                <span className="relative flex items-center justify-center gap-3">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Exam...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-5 h-5" />
                      <span>Create Exam as Draft</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>

              <p className="text-center text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                Exam will be saved as draft. Add questions before publishing.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;