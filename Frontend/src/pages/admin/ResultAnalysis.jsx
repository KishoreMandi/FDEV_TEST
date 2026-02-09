import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import axios from "../../api/axiosInstance";

const ResultAnalysis = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data } = await axios.get(`/results/${resultId}`);
        setSelectedResult(data);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load analysis details");
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      fetchAnalysis();
    }
  }, [resultId]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!selectedResult) {
    return (
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 ml-64 p-6">
          <AdminHeader />
          <div className="text-center py-10 text-red-500">
            Result not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64 min-w-0 overflow-hidden">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header / Back Button */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-200 rounded-full transition text-gray-600"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Attempt Analysis: {selectedResult.studentId?.name}
                </h2>
                {selectedResult.studentId?.employeeId && (
                  <p className="text-sm font-mono text-gray-600">
                    ID: {selectedResult.studentId.employeeId}
                  </p>
                )}
                <p className="text-gray-500 text-sm">
                  Detailed breakdown of the exam attempt
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
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

            {/* Questions List */}
            <div className="space-y-6">
              {selectedResult.answers?.map((ans, idx) => {
                const question = ans.questionId;
                
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
                    
                    <div className="mt-4 pl-8 flex items-center gap-2 text-sm text-gray-500">
                      <span>Marks:</span>
                      <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                        {isCorrect ? `+1` : `-${0}`} 
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
              <div className="px-6 py-4 bg-yellow-50 border-t border-yellow-100 rounded-xl">
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

          </div>
        </main>
      </div>
    </div>
  );
};

export default ResultAnalysis;