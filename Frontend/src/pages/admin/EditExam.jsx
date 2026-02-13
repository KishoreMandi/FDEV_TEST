import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

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

  async function fetchExam() {
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
  }

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
  }, [id]);

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

    // Validation for Department Mode (Prevent publishing to empty departments)
    if (assignmentMode === "department" && exam.isPublished) {
        if (selectedDepartment === "All") {
            if (users.length === 0) {
                toast.error("No students found in the system. Cannot publish exam.");
                return;
            }
        } else {
            // Check if there are any students in the selected department
            // We use the same 'users' list which is already filtered for students/employees
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
        // If specific, use assignedTo. If department, clear assignedTo.
        assignedTo: assignmentMode === "specific" ? exam.assignedTo : [],
        // Always save the selected department (even if in specific mode) to preserve metadata
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
                 toast.success(`Exam published ONLY to '${selectedDepartment}' Department. (Not visible to others)`);
             }
         }
      } else {
        if (assignmentMode === "specific") {
            toast.success("Exam updated successfully (Draft - Specific Students)");
        } else {
            toast.success(`Exam updated successfully (Draft - ${selectedDepartment})`);
        }
      }
      
      navigate("/admin/manage-exams");
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="ml-64 w-full min-h-screen bg-gray-100 flex items-center justify-center">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full min-h-screen bg-gray-100">
        <AdminHeader />

        <div className="p-6 max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate("/admin/manage-exams")}
                className="p-2 rounded-full hover:bg-white transition"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-800">Edit Exam</h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
               
               {/* LEFT COLUMN: Basic Info */}
               <div className="space-y-6">
                 <h4 className="text-lg font-semibold text-blue-800 border-b pb-2">Basic Details</h4>
                 
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title</label>
                     <input
                       className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       value={exam.title}
                       onChange={(e) => setExam({ ...exam, title: e.target.value })}
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                       <input
                         type="number"
                         className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         value={exam.duration}
                         onChange={(e) => setExam({ ...exam, duration: e.target.value })}
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Attempt Limit</label>
                       <input
                         type="number"
                         min="1"
                         className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         value={exam.attemptLimit || 1}
                         onChange={(e) => setExam({ ...exam, attemptLimit: e.target.value })}
                       />
                     </div>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marking</label>
                     <input
                       type="number"
                       step="0.01"
                       className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                       value={exam.negativeMarking}
                       onChange={(e) => setExam({ ...exam, negativeMarking: e.target.value })}
                     />
                     <p className="text-xs text-gray-500 mt-1">Example: 0.25 for 1/4th deduction</p>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                       <input
                         type="datetime-local"
                         className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         value={exam.startTime}
                         onChange={(e) => handleDateChange("startTime", e.target.value)}
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                       <input
                         type="datetime-local"
                         className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                         value={exam.endTime}
                         onChange={(e) => handleDateChange("endTime", e.target.value)}
                       />
                     </div>
                   </div>
                   
                   <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-100 mt-4">
                     <input
                       type="checkbox"
                       id="edit-published"
                       className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                       checked={exam.isPublished || false}
                       onChange={(e) => setExam({ ...exam, isPublished: e.target.checked })}
                     />
                     <label htmlFor="edit-published" className="font-medium text-gray-700">Publish Exam</label>
                   </div>
                 </div>
               </div>

               {/* RIGHT COLUMN: Settings & Assignment */}
               <div className="space-y-6">
                 
                 {/* PROCTORING */}
                 <div>
                   <h4 className="text-lg font-semibold text-blue-800 border-b pb-2 mb-4">Proctoring Settings</h4>
                   <div className="bg-gray-50 p-4 rounded-xl border space-y-3">
                     <div className="grid grid-cols-2 gap-3">
                       <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition">
                         <input
                           type="checkbox"
                           className="w-4 h-4 text-blue-600 rounded"
                           checked={exam.proctoring?.webcam}
                           onChange={(e) => setExam({
                             ...exam,
                             proctoring: { ...exam.proctoring, webcam: e.target.checked }
                           })}
                         />
                         <span className="text-gray-700 font-medium">Webcam</span>
                       </label>
                       
                       <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition">
                         <input
                           type="checkbox"
                           className="w-4 h-4 text-blue-600 rounded"
                           checked={exam.proctoring?.fullScreen}
                           onChange={(e) => setExam({
                             ...exam,
                             proctoring: { ...exam.proctoring, fullScreen: e.target.checked }
                           })}
                         />
                         <span className="text-gray-700 font-medium">Fullscreen</span>
                       </label>

                       <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition">
                         <input
                           type="checkbox"
                           className="w-4 h-4 text-blue-600 rounded"
                           checked={exam.proctoring?.screenRecording}
                           onChange={(e) => setExam({
                             ...exam,
                             proctoring: { ...exam.proctoring, screenRecording: e.target.checked }
                           })}
                         />
                         <span className="text-gray-700 font-medium">Screen Rec</span>
                       </label>

                       <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition">
                         <input
                           type="checkbox"
                           className="w-4 h-4 text-blue-600 rounded"
                           checked={exam.proctoring?.tabSwitch}
                           onChange={(e) => setExam({
                             ...exam,
                             proctoring: { ...exam.proctoring, tabSwitch: e.target.checked }
                           })}
                         />
                         <span className="text-gray-700 font-medium">Tab Switch</span>
                       </label>

                       <label className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded transition">
                         <input
                           type="checkbox"
                           className="w-4 h-4 text-blue-600 rounded"
                           checked={exam.proctoring?.multiplePersonDetection}
                           onChange={(e) => setExam({
                             ...exam,
                             proctoring: { ...exam.proctoring, multiplePersonDetection: e.target.checked }
                           })}
                         />
                         <span className="text-gray-700 font-medium">Multi-Person</span>
                       </label>
                     </div>

                     {exam.proctoring?.tabSwitch && (
                       <div className="mt-2 pt-2 border-t flex items-center gap-3">
                         <span className="text-sm text-gray-600">Max Violations Allowed:</span>
                         <input
                           type="number"
                           className="w-16 p-1 border rounded text-center font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                           value={exam.proctoring?.tabSwitchLimit}
                           onChange={(e) => setExam({
                             ...exam,
                             proctoring: { ...exam.proctoring, tabSwitchLimit: Number(e.target.value) }
                           })}
                         />
                       </div>
                     )}
                   </div>
                 </div>

                 {/* ASSIGNMENT */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-800 border-b pb-2 mb-4">Assign Candidates</h4>
                  
                  {/* Assignment Mode Toggle */}
                  <div className="flex gap-4 mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="assignmentMode"
                        value="department"
                        checked={assignmentMode === "department"}
                        onChange={() => setAssignmentMode("department")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 font-medium">By Department</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="assignmentMode"
                        value="specific"
                        checked={assignmentMode === "specific"}
                        onChange={() => setAssignmentMode("specific")}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 font-medium">Specific Students</span>
                    </label>
                  </div>

                  {/* DEPARTMENT SELECTOR */}
                  {assignmentMode === "department" && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Department</label>
                      <select
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                      <p className="text-xs text-gray-500 mt-1">
                        Exam will be visible to all students in the selected department.
                      </p>
                    </div>
                  )}

                  {/* SPECIFIC STUDENTS LIST */}
                  {assignmentMode === "specific" && (
                  <div className={`bg-gray-50 border rounded-xl overflow-hidden flex flex-col h-64 transition-opacity`}>
                    <div className="p-2 bg-gray-100 border-b text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Select Students
                    </div>
                     <div className="overflow-y-auto flex-1 p-2 space-y-2">
                       {Object.keys(groupedUsers).length === 0 ? (
                         <div className="h-full flex items-center justify-center text-gray-500 italic">
                           No candidates found.
                         </div>
                       ) : (
                         Object.entries(groupedUsers).map(([dept, deptUsers]) => (
                           <div key={dept} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                             <button
                               onClick={() => toggleDept(dept)}
                               className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 transition text-left"
                             >
                               <span className="font-medium text-gray-700">{dept} <span className="text-xs text-gray-500">({deptUsers.length})</span></span>
                               <svg 
                                 className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${expandedDepts.includes(dept) ? 'rotate-180' : ''}`} 
                                 fill="none" stroke="currentColor" viewBox="0 0 24 24"
                               >
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                               </svg>
                             </button>
                             
                             {expandedDepts.includes(dept) && (
                               <div className="p-2 space-y-1 bg-white border-t animate-in slide-in-from-top-1 duration-200">
                                 {deptUsers.map((u) => (
                                   <label 
                                     key={u._id} 
                                     className={`flex items-center gap-3 p-2 rounded-md border transition cursor-pointer hover:bg-gray-50 ${
                                       exam.assignedTo?.includes(u._id) ? 'bg-blue-50 border-blue-200' : 'border-gray-100'
                                     }`}
                                   >
                                     <input
                                       type="checkbox"
                                       className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                       checked={exam.assignedTo?.includes(u._id)}
                                       onChange={() => handleUserSelect(u._id)}
                                     />
                                     <div className="flex flex-col">
                                       <span className="font-medium text-gray-800 text-sm">{u.name}</span>
                                       <span className="text-xs text-gray-500">ID: {u.employeeId || "N/A"}</span>
                                     </div>
                                   </label>
                                 ))}
                               </div>
                             )}
                           </div>
                         ))
                       )}
                     </div>
                     <div className="p-2 bg-gray-100 border-t text-xs text-center text-gray-500">
                        {exam.assignedTo?.length > 0 
                          ? `${exam.assignedTo.length} candidates selected`
                          : "No candidates selected (Exam will NOT be published)"}
                    </div>
                  </div>
                  )}
                </div>

               </div>
             </div>

             {/* FOOTER */}
             <div className="p-6 border-t bg-gray-50 flex justify-end gap-3 rounded-b-2xl">
               <button
                 onClick={() => navigate("/admin/manage-exams")}
                 className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition"
               >
                 Cancel
               </button>
               <button
                 onClick={handleUpdate}
                 className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg hover:shadow-xl transition transform active:scale-95"
               >
                 Save Changes
               </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditExam;
