import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import axios from "../../api/axiosInstance";
import { getDepartments } from "../../api/departmentApi";
import { 
  FileText, 
  AlertCircle, 
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
    const fetchDepts = async () => {
      try {
        const res = await getDepartments();
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };
    const timer = setTimeout(() => {
      requestAnimationFrame(() => setIsVisible(true));
      fetchDepts();
    }, 0);
    return () => clearTimeout(timer);
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

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <AdminSidebar />

      <div className="ml-64 flex-1 min-h-screen bg-slate-50">
        <AdminHeader />

        <div className="p-6 max-w-4xl mx-auto">
          <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-slate-900 shadow-md">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Create New Exam
                </h2>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Configure your exam settings and proctoring options
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Basic Information
                      </h3>
                      <p className="text-xs text-gray-500">Enter exam details and schedule</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2 group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        Exam Title
                      </label>
                      <input
                        placeholder="Enter exam title..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Timer className="w-4 h-4 text-slate-500" />
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 60"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                      />
                    </div>

                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Hash className="w-4 h-4 text-slate-500" />
                        Attempt Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="1"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
                        value={attemptLimit}
                        onChange={(e) => setAttemptLimit(e.target.value)}
                      />
                    </div>

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
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
                        value={negativeMarking}
                        onChange={(e) => setNegativeMarking(e.target.value)}
                      />
                    </div>

                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <Building className="w-4 h-4 text-slate-500" />
                        Department
                      </label>
                      <select
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
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

                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-gray-700">Schedule (Optional)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="group">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Start Time</label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      <div className="group">
                        <label className="block text-xs font-medium text-gray-500 mb-1.5">End Time</label>
                        <input
                          type="datetime-local"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Proctoring & Monitoring
                      </h3>
                      <p className="text-xs text-gray-500">Configure security and monitoring options</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-200">
                      <Eye className="w-3 h-3 text-slate-500" />
                      <span className="text-xs font-medium text-slate-700">Advanced</span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proctoringOptions.map((option, index) => {
                      const Icon = option.icon;
                      const isChecked = proctoring[option.key];
                      
                      return (
                        <label 
                          key={option.key}
                          className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                            isChecked 
                              ? "bg-slate-50 border-slate-400 shadow-sm" 
                              : "bg-white border-slate-200 hover:border-slate-400"
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
                            <div className={`p-2 rounded-lg transition-all duration-200 ${
                              isChecked 
                                ? "bg-slate-900" 
                                : "bg-gray-100"
                            }`}>
                              <Icon className={`w-5 h-5 transition-colors ${isChecked ? "text-white" : "text-gray-400"}`} />
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium transition-colors ${isChecked ? "text-slate-900" : "text-gray-700"}`}>
                                  {option.label}
                                </span>
                                {isChecked && (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                            </div>

                            <div className={`w-10 h-6 rounded-full transition-all duration-300 ${
                              isChecked 
                                ? "bg-slate-900" 
                                : "bg-gray-200"
                            }`}>
                              <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 mt-0.5 ${
                                isChecked ? "translate-x-4.5 ml-0.5" : "translate-x-0.5"
                              }`} />
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  {proctoring.tabSwitch && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 animate-fade-in-up">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-slate-900">
                          <AlertCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <label className="text-sm font-medium text-gray-700">Maximum Tab Switch Violations</label>
                          <p className="text-xs text-gray-500">Exam will auto-submit after this limit</p>
                        </div>
                        <input
                          type="number"
                          min="1"
                          className="w-20 px-3 py-2 rounded-lg border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none text-center font-medium"
                          value={proctoring.tabSwitchLimit}
                          onChange={(e) => setProctoring({ ...proctoring, tabSwitchLimit: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
              <button
                type="submit"
                disabled={loading}
                className={`relative w-full px-8 py-4 rounded-2xl font-semibold text-white ${
                  loading 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-slate-900 hover:bg-slate-800 cursor-pointer"
                } transition-colors duration-200`}
              >
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
                      <ArrowRight className="w-5 h-5" />
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
