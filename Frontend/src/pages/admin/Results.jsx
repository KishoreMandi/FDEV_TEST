import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Video, Monitor } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams } from "../../api/examApi";
import axios from "../../api/axiosInstance";

const Results = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleViewAnalysis = (result) => {
    navigate(`/admin/result-analysis/${result._id}`);
  };

  useEffect(() => {
    getExams().then((res) => setExams(res.data));
  }, []);

  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    if (!examId) return;

    axios
      .get(`/results/admin/${examId}`)
      .then((res) => setResults(res.data))
      .catch(() => toast.error("Failed to load results"));
  }, [examId]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 min-w-0 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Exam Results</h2>
              
              <div className="w-64">
                <select
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                >
                  <option value="">Select Exam</option>
                  {exams.map((exam) => (
                    <option key={exam._id} value={exam._id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Accuracy</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Recordings</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {results.map((r) => (
                    <tr key={r._id} className="hover:bg-gray-50 transition">
                      <td className="p-4 font-medium text-gray-900">
                        {r.studentId?.name || "Unknown"}
                        <div className="text-xs text-gray-500 font-normal">{r.studentId?.email}</div>
                        {r.studentId?.employeeId && (
                          <div className="text-xs text-gray-400 font-mono mt-0.5">ID: {r.studentId.employeeId}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-bold text-blue-600">{r.score ?? 0}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${r.accuracy >= 70 ? 'bg-green-500' : r.accuracy >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                              style={{ width: `${r.accuracy}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{r.accuracy}%</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            r.status === "submitted"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {r.status === "submitted" ? "Completed" : "In Progress"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {r.webcamRecording ? (
                            <a 
                              href={`${BASE_URL}/${r.webcamRecording}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                              title="View Webcam"
                            >
                              <Video size={18} />
                            </a>
                          ) : (
                            <span className="p-1.5 text-gray-300"><Video size={18} /></span>
                          )}
                          
                          {r.screenRecording ? (
                            <a 
                              href={`${BASE_URL}/${r.screenRecording}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded transition"
                              title="View Screen"
                            >
                              <Monitor size={18} />
                            </a>
                          ) : (
                            <span className="p-1.5 text-gray-300"><Monitor size={18} /></span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleViewAnalysis(r)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                        >
                          <Eye size={16} />
                          Analysis
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {results.length === 0 && (
                <div className="p-12 text-center text-gray-500">
                  {examId ? "No students have attempted this exam yet." : "Please select an exam to view results."}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Results;