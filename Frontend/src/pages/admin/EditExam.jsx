import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  ArrowLeft, Save, Calendar, Clock, AlertTriangle, 
  Users, Shield, Eye, Lock, Layout, Video, Monitor, 
  Mic, MousePointer, XCircle, CheckCircle, ChevronDown,
  Timer, Hash, Percent, Layers
} from "lucide-react";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExamById, updateExam } from "../../api/examApi";
import { getUsers } from "../../api/adminApi";
import { getDepartments } from "../../api/departmentApi";

const EditExam = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [expandedDepts, setExpandedDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Assignment State
  const [assignmentMode, setAssignmentMode] = useState("department"); // 'department' or 'specific'
  const [selectedDepartment, setSelectedDepartment] = useState("All");

  function formatDateTimeLocal(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  }

  async function loadDepartments() {
    try {
      const res = await getDepartments();
      setDepartments(res.data);
    } catch (err) {
      console.error("Failed to load departments", err);
    }
  }

  const fetchExam = useCallback(async () => {
    try {
      const res = await getExamById(id);
      const data = res.data;
      
      setExam({
        ...data,
        assignedTo: data.assignedTo || [],
        startTime: data.startTime ? formatDateTimeLocal(data.startTime) : "",
        endTime: data.endTime ? formatDateTimeLocal(data.endTime) : "",
        proctoring: data.proctoring || {
          webcam: false,
          fullScreen: false,
          tabSwitch: false,
          screenRecording: false,
          multiplePersonDetection: false,
          tabSwitchLimit: 3,
        },
      });

      // Initialize Assignment State
      if (data.assignedTo && data.assignedTo.length > 0) {
        setAssignmentMode("specific");
      } else {
        setAssignmentMode("department");
      }
      setSelectedDepartment(data.department || "All");
      
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch exam", error);
      toast.error("Failed to load exam details");
      navigate("/admin/manage-exams");
    }
  }, [id, navigate]);

  async function loadUsers() {
    try {
      const res = await getUsers();
      // Filter only students and employees
      const filtered = res.data.filter(u => u.role === "student" || u.role === "employee");
      setUsers(filtered);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchExam();
      loadUsers();
      loadDepartments();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [id, fetchExam]);

  const handleDateChange = (field, value) => {
    const newState = { ...exam, [field]: value };
    
    if (newState.startTime && newState.endTime) {
      const start = new Date(newState.startTime);
      const end = new Date(newState.endTime);
      const diffMs = end - start;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins > 0) {
        newState.duration = diffMins;
      }
    }
    setExam(newState);
  };

  const handleUserSelect = (userId) => {
    setExam((prev) => {
      const current = prev.assignedTo || [];
      if (current.includes(userId)) {
        return { ...prev, assignedTo: current.filter((id) => id !== userId) };
      } else {
        return { ...prev, assignedTo: [...current, userId] };
      }
    });
  };

  const toggleDept = (dept) => {
    setExpandedDepts(prev => 
      prev.includes(dept) ? prev.filter(d => d !== dept) : [...prev, dept]
    );
  };

  const groupedUsers = users.reduce((acc, user) => {
    const dept = user.department || "General";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {});

  const handleUpdate = async () => {
    const now = new Date();
    const start = exam.startTime ? new Date(exam.startTime) : null;
    const end = exam.endTime ? new Date(exam.endTime) : null;

    if (start && start < now) {
      toast.error("Start Time cannot be in the past.");
      return;
    }

    if (end && end < now) {
      toast.error("End Time cannot be in the past.");
      return;
    }

    if (start && end && start >= end) {
      toast.error("End Time must be after Start Time.");
      return;
    }

    // Validation for Specific Mode
    if (assignmentMode === "specific" && (!exam.assignedTo || exam.assignedTo.length === 0)) {
      toast.error("Please select at least one student or switch to Department mode.");
      return;
    }

    // Validation for Department Mode
    if (assignmentMode === "department" && exam.isPublished) {
        if (selectedDepartment === "All") {
            if (users.length === 0) {
                toast.error("No students found in the system. Cannot publish exam.");
                return;
            }
        } else {
            const usersInDept = users.filter(u => (u.department || "General") === selectedDepartment);
            if (usersInDept.length === 0) {
                toast.error(`No candidates found in '${selectedDepartment}' department. Cannot publish exam.`);
                return;
            }
        }
    }

    try {
      const payload = {
        ...exam,
        startTime: exam.startTime ? new Date(exam.startTime).toISOString() : null,
        endTime: exam.endTime ? new Date(exam.endTime).toISOString() : null,
        proctoring: exam.proctoring,
        assignedTo: assignmentMode === "specific" ? exam.assignedTo : [],
        department: selectedDepartment,
      };
      await updateExam(exam._id, payload);
      
      if (exam.isPublished) {
         if (assignmentMode === "specific") {
             toast.success(`Exam published ONLY to ${exam.assignedTo.length} specific student(s).`);
         } else {
             if (selectedDepartment === "All") {
                 toast.success("Exam published to ALL Departments.");
             } else {
                 toast.success(`Exam published ONLY to '${selectedDepartment}' Department.`);
             }
         }
      } else {
        toast.success("Exam updated successfully (Draft)");
      }
      
      navigate("/admin/manage-exams");
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <AdminSidebar />
        <div className="ml-64 w-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <AdminSidebar />
      <div className="ml-64 w-full flex flex-col">
        <AdminHeader />

        <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/admin/manage-exams")}
                className="p-3 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-amber-500 hover:border-amber-500/50 hover:shadow-md transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" />
              </button>
              <div>
                <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Exam</h2>
                <p className="text-slate-500 text-sm mt-1">Configure exam settings and details</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                 exam.isPublished 
                   ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                   : "bg-slate-100 text-slate-500 border-slate-200"
               }`}>
                 <span className={`w-2 h-2 rounded-full ${exam.isPublished ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`}></span>
                 <span className="text-sm font-bold uppercase tracking-wider">{exam.isPublished ? "Published" : "Draft"}</span>
              </div>
              
              <button
                onClick={handleUpdate}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-black font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 border-t border-slate-800"
              >
                <Save className="w-4 h-4 text-amber-500" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN - MAIN INFO (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Card 1: Basic Information */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Layout className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Basic Information</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Exam Title</label>
                    <div className="relative">
                      <input
                        className="w-full pl-4 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none text-slate-900 font-semibold placeholder:text-slate-400"
                        value={exam.title}
                        onChange={(e) => setExam({ ...exam, title: e.target.value })}
                        placeholder="e.g. Advanced Physics Mid-Term"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Duration</label>
                      <div className="relative">
                        <Timer className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          className="w-full pl-10 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none text-slate-900 font-medium"
                          value={exam.duration}
                          onChange={(e) => setExam({ ...exam, duration: e.target.value })}
                        />
                        <span className="absolute right-4 top-3.5 text-xs font-bold text-slate-400">MIN</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Attempts</label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          min="1"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none text-slate-900 font-medium"
                          value={exam.attemptLimit || 1}
                          onChange={(e) => setExam({ ...exam, attemptLimit: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Negative Marking</label>
                      <div className="relative">
                        <Percent className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <input
                          type="number"
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none text-slate-900 font-medium"
                          value={exam.negativeMarking}
                          onChange={(e) => setExam({ ...exam, negativeMarking: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Schedule */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Schedule & Timing</h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Start Date & Time</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input
                        type="datetime-local"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none text-slate-700 font-medium"
                        value={exam.startTime}
                        onChange={(e) => handleDateChange("startTime", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">End Date & Time</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                      </div>
                      <input
                        type="datetime-local"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none text-slate-700 font-medium"
                        value={exam.endTime}
                        onChange={(e) => handleDateChange("endTime", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Assignment */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Candidates & Access</h3>
                </div>
                
                <div className="p-6">
                  {/* Mode Toggle */}
                  <div className="flex p-1 bg-slate-100 rounded-xl mb-6 w-full md:w-fit">
                    {[
                      { value: 'department', label: 'Department Wise' },
                      { value: 'specific', label: 'Specific Students' }
                    ].map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => setAssignmentMode(mode.value)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                          assignmentMode === mode.value
                            ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>

                  {assignmentMode === "department" ? (
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Select Target Department</label>
                      <div className="relative">
                        <Layers className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
                        <select
                          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none text-slate-700 font-medium appearance-none cursor-pointer"
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
                        <ChevronDown className="absolute right-4 top-4 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        Exam will be accessible to all students in the selected department.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col h-[400px]">
                       <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-500 uppercase">Student Directory</span>
                         <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold border border-amber-200">
                           {exam.assignedTo?.length || 0} Selected
                         </span>
                       </div>
                       <div className="flex-1 overflow-y-auto p-2 bg-slate-50/50 custom-scrollbar">
                         {Object.keys(groupedUsers).length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400">
                             <Users className="w-10 h-10 mb-2 opacity-20" />
                             <span className="text-sm font-medium">No candidates found</span>
                           </div>
                         ) : (
                           <div className="space-y-3">
                             {Object.entries(groupedUsers).map(([dept, deptUsers]) => (
                               <div key={dept} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                 <button
                                   onClick={() => toggleDept(dept)}
                                   className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                                 >
                                   <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-700 text-sm">{dept}</span>
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium">{deptUsers.length}</span>
                                   </div>
                                   <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedDepts.includes(dept) ? 'rotate-180' : ''}`} />
                                 </button>
                                 
                                 {expandedDepts.includes(dept) && (
                                   <div className="border-t border-slate-100 divide-y divide-slate-50">
                                     {deptUsers.map((u) => (
                                       <label 
                                         key={u._id} 
                                         className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                                           exam.assignedTo?.includes(u._id) 
                                             ? 'bg-amber-50/50' 
                                             : 'hover:bg-slate-50'
                                         }`}
                                       >
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                           exam.assignedTo?.includes(u._id)
                                             ? 'bg-amber-500 border-amber-500 text-white'
                                             : 'bg-white border-slate-300'
                                         }`}>
                                           {exam.assignedTo?.includes(u._id) && <CheckCircle className="w-3.5 h-3.5" />}
                                         </div>
                                         <input
                                           type="checkbox"
                                           className="hidden"
                                           checked={exam.assignedTo?.includes(u._id) || false}
                                           onChange={() => handleUserSelect(u._id)}
                                         />
                                         <div>
                                           <p className={`text-sm font-medium ${exam.assignedTo?.includes(u._id) ? 'text-slate-900' : 'text-slate-600'}`}>{u.name}</p>
                                           <p className="text-[10px] text-slate-400 font-mono">{u.employeeId || "ID: N/A"}</p>
                                         </div>
                                       </label>
                                     ))}
                                   </div>
                                 )}
                               </div>
                             ))}
                           </div>
                         )}
                       </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN - SETTINGS & ACTIONS (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              
              {/* Card 4: Status Toggle */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-slate-800">Exam Status</h3>
                   <span className={`text-xs font-bold px-2 py-1 rounded border uppercase ${
                     exam.isPublished ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                   }`}>
                     {exam.isPublished ? "Live" : "Hidden"}
                   </span>
                 </div>
                 
                 <label className={`relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                   exam.isPublished 
                     ? "border-emerald-500 bg-emerald-50/30" 
                     : "border-slate-200 bg-slate-50 hover:border-slate-300"
                 }`}>
                   <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                       exam.isPublished ? "bg-emerald-100 text-emerald-600" : "bg-slate-200 text-slate-400"
                     }`}>
                       <Eye className="w-5 h-5" />
                     </div>
                     <div>
                       <span className={`block text-sm font-bold ${exam.isPublished ? "text-emerald-700" : "text-slate-600"}`}>
                         {exam.isPublished ? "Published" : "Draft Mode"}
                       </span>
                       <span className="text-[10px] text-slate-400 font-medium">
                         {exam.isPublished ? "Visible to students" : "Hidden from students"}
                       </span>
                     </div>
                   </div>
                   <input
                     type="checkbox"
                     className="sr-only"
                     checked={exam.isPublished || false}
                     onChange={(e) => setExam({ ...exam, isPublished: e.target.checked })}
                   />
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                     exam.isPublished ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                   }`}>
                     {exam.isPublished && <CheckCircle className="w-4 h-4" />}
                   </div>
                 </label>
              </div>

              {/* Card 5: Proctoring */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">Proctoring</h3>
                </div>
                
                <div className="p-6 space-y-4">
                  {[
                    { id: 'webcam', label: 'Webcam', icon: Video, desc: "Monitor candidate via camera" },
                    { id: 'fullScreen', label: 'Fullscreen', icon: Monitor, desc: "Force fullscreen mode" },
                    { id: 'screenRecording', label: 'Screen Rec', icon: Layout, desc: "Record entire screen" },
                    { id: 'tabSwitch', label: 'Tab Lock', icon: Lock, desc: "Prevent tab switching" },
                    { id: 'multiplePersonDetection', label: 'AI Monitor', icon: Users, desc: "Detect multiple faces" }
                  ].map((item) => {
                    const Icon = item.icon;
                    const isChecked = exam.proctoring?.[item.id] || false;
                    return (
                      <label key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all group ${
                        isChecked
                          ? 'bg-amber-50 border-amber-500 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className={`p-2 rounded-lg transition-colors ${
                          isChecked ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'
                        }`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className={`text-sm font-bold ${isChecked ? 'text-slate-900' : 'text-slate-600'}`}>
                              {item.label}
                            </span>
                            {isChecked && <CheckCircle className="w-4 h-4 text-amber-500" />}
                          </div>
                          <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">{item.desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={isChecked}
                          onChange={(e) => setExam({
                            ...exam,
                            proctoring: { ...exam.proctoring, [item.id]: e.target.checked }
                          })}
                        />
                      </label>
                    );
                  })}

                  {exam.proctoring?.tabSwitch && (
                    <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Violation Limit</span>
                        <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {exam.proctoring?.tabSwitchLimit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        value={exam.proctoring?.tabSwitchLimit}
                        onChange={(e) => setExam({
                          ...exam,
                          proctoring: { ...exam.proctoring, tabSwitchLimit: Number(e.target.value) }
                        })}
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-medium">
                        <span>Strict (1)</span>
                        <span>Lenient (10)</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditExam;
