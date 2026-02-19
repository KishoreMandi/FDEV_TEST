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
    const frameId = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    getExams().then((res) => setExams(res.data));

    return () => {
      cancelAnimationFrame(frameId);
    };
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
    <div className="flex h-screen overflow-hidden bg-slate-100">
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
                    <div className="relative p-3 bg-slate-900 rounded-2xl shadow-xl">
                      <BarChart3 className="w-8 h-8 text-amber-300" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">
                        Exam Results
                    </h2>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      View and analyze student performance
                    </p>
                  </div>
                </div>

                <div className="relative w-full md:w-72">
                  <select
                    className="relative w-full px-4 py-3 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all duration-300 font-medium text-gray-700"
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
                <div className="relative">
                  <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-900 shadow-lg">
                        <Users className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total Attempts</p>
                        <p className="text-2xl font-bold text-slate-900">{results.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-900 shadow-lg">
                        <TrendingUp className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Score</p>
                        <p className="text-2xl font-bold text-slate-900">{avgScore}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-slate-900 shadow-lg">
                        <BarChart3 className="w-6 h-6 text-amber-300" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Avg Accuracy</p>
                        <p className="text-2xl font-bold text-slate-900">{avgAccuracy}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Results Table */}
            <div className={`relative transition-all duration-700`} style={{ transitionDelay: '200ms' }}>
              
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                      <FileText className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Student Results
                      </h3>
                      <p className="text-xs text-gray-500">{results.length} result(s) found</p>
                    </div>
                  </div>
                </div>

                {results.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">{examId ? "No students have attempted this exam yet" : "Please select an exam to view results"}</p>
                    <p className="text-gray-400 text-sm mt-1">Results will appear here after students complete the exam</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-4 font-semibold text-slate-700">Student</th>
                          <th className="p-4 font-semibold text-slate-700 text-center">Score</th>
                          <th className="p-4 font-semibold text-slate-700">Accuracy</th>
                          <th className="p-4 font-semibold text-slate-700 text-center">Status</th>
                          <th className="p-4 font-semibold text-slate-700 text-center">Recordings</th>
                          <th className="p-4 font-semibold text-slate-700 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((r, index) => (
                          <tr 
                            key={r._id} 
                            className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200"
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                                  <span className="text-amber-300 font-bold">{r.studentId?.name?.charAt(0)?.toUpperCase() || '?'}</span>
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
                              <span className="text-2xl font-bold text-slate-900">{r.score ?? 0}</span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      r.accuracy >= 70 ? 'bg-green-500' : 
                                      r.accuracy >= 40 ? 'bg-amber-500' : 
                                      'bg-red-500'
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
                                  ? "bg-green-100 text-green-700 border border-green-200" 
                                  : "bg-amber-100 text-amber-700 border border-amber-200"
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
                                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200"
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
                                    className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all duration-200"
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
                                className="group relative overflow-hidden px-4 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
                              >
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
