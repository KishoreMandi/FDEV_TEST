import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, Video, Monitor, BarChart3, Sparkles, FileText, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams } from "../../api/examApi";
import axios from "../../api/axiosInstance";

const Results = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [results, setResults] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  const handleViewAnalysis = (result) => {
    navigate(`/admin/result-analysis/${result._id}`);
  };

  useEffect(() => {
    setIsVisible(true);
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

  const avgScore = results.length > 0 ? (results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length).toFixed(1) : 0;
  const avgAccuracy = results.length > 0 ? (results.reduce((acc, r) => acc + (r.accuracy || 0), 0) / results.length).toFixed(1) : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 min-w-0 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-50" />
                    <div className="relative p-3 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl shadow-xl">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold">
                      <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Exam Results
                      </span>
                    </h2>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      View and analyze student performance
                    </p>
                  </div>
                </div>

                <div className="relative group w-full md:w-72">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                  <select
                    className="relative w-full px-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300 font-medium text-gray-700"
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
            </div>

            {/* Stats */}
            {examId && results.length > 0 && (
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-700`} style={{ transitionDelay: '100ms' }}>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-white to-pink-50/50 p-5 rounded-2xl border border-pink-100 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Attempts</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{results.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-white to-blue-50/50 p-5 rounded-2xl border border-blue-100 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                        <TrendingUp className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Score</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{avgScore}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
                  <div className="relative bg-gradient-to-br from-white to-green-50/50 p-5 rounded-2xl border border-green-100 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Accuracy</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{avgAccuracy}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className={`relative group transition-all duration-700`} style={{ transitionDelay: '200ms' }}>
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-15 group-hover:opacity-25 transition-opacity duration-500" />
              
              <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-2xl shadow-xl border border-purple-100/50 overflow-hidden">
                <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-white to-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-lg">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                        Student Results
                      </h3>
                      <p className="text-xs text-gray-500">{results.length} result(s) found</p>
                    </div>
                  </div>
                </div>

                {results.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">{examId ? "No students have attempted this exam yet" : "Please select an exam to view results"}</p>
                    <p className="text-gray-400 text-sm mt-1">Results will appear here after students complete the exam</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-50/80 to-pink-50/80">
                          <th className="p-4 font-semibold text-purple-700">Student</th>
                          <th className="p-4 font-semibold text-purple-700 text-center">Score</th>
                          <th className="p-4 font-semibold text-purple-700">Accuracy</th>
                          <th className="p-4 font-semibold text-purple-700 text-center">Status</th>
                          <th className="p-4 font-semibold text-purple-700 text-center">Recordings</th>
                          <th className="p-4 font-semibold text-purple-700 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, index) => (
                          <tr 
                            key={r._id} 
                            className="border-b border-purple-100/50 hover:bg-gradient-to-r hover:from-pink-50/30 hover:to-purple-50/30 transition-all duration-200"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                                  <span className="text-white font-bold">{r.studentId?.name?.charAt(0)?.toUpperCase() || '?'}</span>
                                </div>
                                <div>
                                  <p className="font-semibold text-gray-800">{r.studentId?.name || "Unknown"}</p>
                                  <p className="text-xs text-gray-500">{r.studentId?.email}</p>
                                  {r.studentId?.employeeId && (
                                    <p className="text-xs text-gray-400 font-mono">ID: {r.studentId.employeeId}</p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{r.score ?? 0}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      r.accuracy >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 
                                      r.accuracy >= 40 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 
                                      'bg-gradient-to-r from-red-500 to-pink-500'
                                    }`}
                                    style={{ width: `${r.accuracy}%` }}
                                  />
                                </div>
                                <span className={`text-sm font-semibold ${
                                  r.accuracy >= 70 ? 'text-green-600' : 
                                  r.accuracy >= 40 ? 'text-amber-600' : 
                                  'text-red-600'
                                }`}>{r.accuracy}%</span>
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                r.status === "submitted" 
                                  ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200" 
                                  : "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200"
                              }`}>
                                {r.status === "submitted" ? "Completed" : "In Progress"}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex justify-center gap-2">
                                {r.webcamRecording ? (
                                  <a 
                                    href={`${BASE_URL}/${r.webcamRecording}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 hover:shadow-lg hover:shadow-pink-200/30 transition-all duration-200"
                                    title="View Webcam"
                                  >
                                    <Video className="w-5 h-5" />
                                  </a>
                                ) : (
                                  <span className="p-2 text-gray-300"><Video className="w-5 h-5" /></span>
                                )}
                                
                                {r.screenRecording ? (
                                  <a 
                                    href={`${BASE_URL}/${r.screenRecording}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 hover:shadow-lg hover:shadow-purple-200/30 transition-all duration-200"
                                    title="View Screen"
                                  >
                                    <Monitor className="w-5 h-5" />
                                  </a>
                                ) : (
                                  <span className="p-2 text-gray-300"><Monitor className="w-5 h-5" /></span>
                                )}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => handleViewAnalysis(r)}
                                className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                              >
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <span className="relative flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  Analysis
                                </span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Results;