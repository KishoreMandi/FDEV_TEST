import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye, CheckCircle, XCircle, Video, Monitor, X } from "lucide-react";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams } from "../../api/examApi";
import axios from "../../api/axiosInstance";

const Results = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null); // For modal

  const handleViewAnalysis = async (result) => {
    setSelectedResult(result); // Open modal with existing data first
    try {
      const { data } = await axios.get(`/results/${result._id}`);
      setSelectedResult(data); // Update with full details
    } catch (error) {
      console.error(error);
      toast.error("Failed to load full analysis details");
    }
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

        {/* DETAILED ANALYSIS MODAL */}
        {selectedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="p-6 border-b flex justify-between items-start bg-gray-50 rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Attempt Analysis: {selectedResult.studentId?.name}
                  </h3>
                  <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      <span className="font-bold text-gray-900">Score:</span> {selectedResult.score}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      <span className="font-bold text-gray-900">Accuracy:</span> {selectedResult.accuracy}%
                    </span>
                    <span className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full text-green-800">
                      <span className="font-bold">Correct:</span> {selectedResult.correct || 0}
                    </span>
                    <span className="flex items-center gap-1 bg-red-100 px-3 py-1 rounded-full text-red-800">
                      <span className="font-bold">Wrong:</span> {selectedResult.wrong || 0}
                    </span>
                    <span className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-yellow-800">
                      <span className="font-bold">Unattempted:</span> {selectedResult.unattempted || 0}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                      <span className="font-bold text-gray-900">Submitted:</span> {new Date(selectedResult.submittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-2 rounded-full transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body - Questions List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                {selectedResult.answers?.map((ans, idx) => {
                  const question = ans.questionId;
                  // Handle missing question data gracefully
                  if (!question) {
                     return (
                      <div key={idx} className="bg-white p-6 rounded-xl border-l-4 border-gray-300 shadow-sm opacity-60">
                         <h4 className="font-medium text-gray-500">
                           Q{idx + 1}. Question data unavailable (Question may have been deleted)
                         </h4>
                      </div>
                     );
                  }

                  const isSkipped = ans.selectedOption === null || ans.selectedOption === undefined || ans.selectedOption === "";
                  const isCorrect = !isSkipped && Number(ans.selectedOption) === question.correctOption;

                  return (
                    <div 
                      key={idx} 
                      className={`bg-white p-6 rounded-xl border-l-4 shadow-sm ${
                        isCorrect ? "border-green-500" : isSkipped ? "border-gray-400" : "border-red-500"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-medium text-gray-900 text-lg flex gap-3">
                          <span className="text-gray-400 font-bold">Q{idx + 1}.</span>
                          {question.question || "Question text missing"}
                        </h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          isCorrect 
                            ? "bg-green-100 text-green-700" 
                            : isSkipped 
                              ? "bg-gray-100 text-gray-600" 
                              : "bg-red-100 text-red-700"
                        }`}>
                          {isCorrect ? "Correct" : isSkipped ? "Skipped" : "Wrong"}
                        </span>
                      </div>

                      <div className="space-y-2 pl-8">
                        {(question.options && question.options.length > 0) ? (
                          question.options.map((opt, optIdx) => {
                            const isSelected = Number(ans.selectedOption) === optIdx;
                            const isAnswer = question.correctOption === optIdx;
                            
                            let rowClass = "border border-gray-200 bg-white";
                            let icon = null;
  
                            if (isAnswer) {
                              rowClass = "border-green-200 bg-green-50 text-green-800 font-medium";
                              icon = <CheckCircle size={16} className="text-green-600" />;
                            } else if (isSelected && !isAnswer) {
                              rowClass = "border-red-200 bg-red-50 text-red-800";
                              icon = <XCircle size={16} className="text-red-600" />;
                            }
  
                            return (
                              <div 
                                key={optIdx} 
                                className={`p-3 rounded-lg flex items-center justify-between ${rowClass}`}
                              >
                                <span className="flex items-center gap-3">
                                  <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white border text-xs font-bold text-gray-500 shadow-sm">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  {opt}
                                </span>
                                {isSelected && <span className="text-xs font-bold uppercase mr-2">(Selected)</span>}
                                {icon}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-red-500 text-sm italic">Options unavailable</div>
                        )}
                      </div>
                      
                      {/* Marks Info */}
                      <div className="mt-4 pl-8 flex items-center gap-2 text-sm text-gray-500">
                        <span>Marks:</span>
                        <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                          {isCorrect ? `+1` : `-${0}`} 
                          {/* Note: Backend logic subtracts negative marking, frontend just shows raw status. 
                              If we had access to 'marks' per question or exam config, we could show exact. 
                              For now, generic indicator is fine or we can assume +1. 
                          */}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {(!selectedResult.answers || selectedResult.answers.length === 0) && (
                  <div className="text-center py-10 text-gray-500">
                    No detailed answer data available for this attempt.
                  </div>
                )}
              </div>
              
              {/* Activity Logs Section */}
              {selectedResult.activityLogs && selectedResult.activityLogs.length > 0 && (
                <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100">
                  <h4 className="font-bold text-yellow-800 mb-2">Suspicious Activity Logs</h4>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    {selectedResult.activityLogs.map((log, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="font-mono text-xs opacity-70">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span>
                          {log.message || log.type}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 border-t bg-white rounded-b-2xl text-right">
                <button
                  onClick={() => setSelectedResult(null)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;