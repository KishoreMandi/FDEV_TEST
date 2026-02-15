import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, ArrowLeft, Code, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import CodingEnvironment from "../../components/CodingEnvironment";
import axios from "../../api/axiosInstance";
import { getExamById, getAdminQuestions } from "../../api/examApi";

const ResultAnalysis = () => {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [selectedResult, setSelectedResult] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retryModalOpen, setRetryModalOpen] = useState(false);
  const [retryData, setRetryData] = useState(null);

  const handleRetry = (question, ans) => {
    setRetryData({
      question,
      initialData: {
        code: ans?.code || "",
        language: ans?.language || question.codingData?.language || "javascript"
      }
    });
    setRetryModalOpen(true);
  };

  // Recalculate stats based on all questions
  const stats = (() => {
    if (!selectedResult || questions.length === 0) return null;
    
    let correct = 0;
    let wrong = 0;
    let unattempted = 0;
    
    questions.forEach(q => {
      const ans = selectedResult.answers?.find(a => 
        (a.questionId?._id || a.questionId) === q._id
      );
      
      const isSkipped = !ans || (q.type === "mcq" && (ans.selectedOption === null || ans.selectedOption === undefined || ans.selectedOption === "")) || (q.type === "coding" && !ans.code);
      
      if (isSkipped) {
        unattempted++;
      } else {
        let isCorrect = false;
        if (q.type === "mcq") {
          // Ensure both are treated as numbers for comparison
          isCorrect = Number(ans.selectedOption) === Number(q.correctOption);
        } else if (q.type === "coding") {
          isCorrect = !!ans.isCorrect;
        }
        
        if (isCorrect) correct++;
        else wrong++;
      }
    });
    
    const score = correct; // Assuming 1 mark per question
    const accuracy = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
    
    return { score, accuracy, correct, wrong, unattempted };
  })();

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const { data } = await axios.get(`/results/${resultId}`);
        setSelectedResult(data);

        // Fetch Exam details for title if not fully populated
        const examId = data.examId?._id || data.examId;
        if (examId) {
          const examRes = await getExamById(examId);
          setExam(examRes.data);
          
          // Fetch all questions for this exam to show unattempted ones
          // Use getAdminQuestions to ensure we get the correctOption field
          const qRes = await getAdminQuestions(examId);
          setQuestions(qRes.data);
        }
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
                {exam?.title && (
                  <p className="text-md text-gray-700 font-semibold">
                    Exam: {exam.title}
                  </p>
                )}
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
                  <span className="font-bold text-gray-900">Score:</span> {stats?.score ?? selectedResult.score}
                </span>
                <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  <span className="font-bold text-gray-900">Accuracy:</span> {stats?.accuracy ?? selectedResult.accuracy}%
                </span>
                <span className="flex items-center gap-1 bg-green-100 px-3 py-1 rounded-full text-green-800">
                  <span className="font-bold">Correct:</span> {stats?.correct ?? (selectedResult.correct || 0)}
                </span>
                <span className="flex items-center gap-1 bg-red-100 px-3 py-1 rounded-full text-red-800">
                  <span className="font-bold">Wrong:</span> {stats?.wrong ?? (selectedResult.wrong || 0)}
                </span>
                <span className="flex items-center gap-1 bg-yellow-100 px-3 py-1 rounded-full text-yellow-800">
                  <span className="font-bold">Unattempted:</span> {stats?.unattempted ?? (selectedResult.unattempted || 0)}
                </span>
                <span className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full">
                  <span className="font-bold text-gray-900">Submitted:</span> {new Date(selectedResult.submittedAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-6">
              {questions.map((question, idx) => {
                // Find student's answer for this specific question
                const ans = selectedResult.answers?.find(a => 
                  (a.questionId?._id || a.questionId) === question._id
                );
                
                const isSkipped = !ans || (question.type === "mcq" && (ans.selectedOption === null || ans.selectedOption === undefined || ans.selectedOption === "")) || (question.type === "coding" && !ans.code);
                
                let isCorrect = false;
                if (!isSkipped) {
                  if (question.type === "mcq") {
                    isCorrect = Number(ans.selectedOption) === Number(question.correctOption);
                  } else if (question.type === "coding") {
                    isCorrect = !!ans.isCorrect; // Assuming the backend stores if the coding solution passed
                  }
                }

                return (
                  <div 
                    key={question._id || idx} 
                    className={`bg-white p-6 rounded-xl border-l-4 shadow-sm ${
                      isCorrect ? "border-green-500" : isSkipped ? "border-gray-400" : "border-red-500"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-lg flex gap-3">
                          <span className="text-gray-400 font-bold">Q{idx + 1}.</span>
                          {question.question || "Question text missing"}
                        </h4>
                        {question.type === "coding" && (
                          <div className="mt-2 text-sm text-blue-600 flex items-center gap-1">
                            <Code size={16} />
                            <span>Coding Question</span>
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        isCorrect 
                          ? "bg-green-100 text-green-700" 
                          : isSkipped 
                            ? "bg-gray-100 text-gray-600" 
                            : "bg-red-100 text-red-700"
                      }`}>
                        {isCorrect ? "Correct" : isSkipped ? "Unattempted" : "Wrong"}
                      </span>
                    </div>

                    <div className="space-y-2 pl-8">
                      {question.type === "mcq" && question.options && question.options.length > 0 ? (
                        question.options.map((opt, optIdx) => {
                          const isSelected = ans && Number(ans.selectedOption) === optIdx;
                          const isAnswer = Number(question.correctOption) === optIdx;
                          
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
                      ) : question.type === "coding" ? (
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Problem Statement:</p>
                            <div className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-3 rounded border">
                              {question.description || "No description provided."}
                            </div>
                          </div>
                          
                          <p className="text-sm font-medium text-gray-700 mb-2">Student&apos;s Code:</p>
                          <pre className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto min-h-[100px]">
                            <code>{ans?.code || "// No code submitted"}</code>
                          </pre>
                          
                          <div className="flex justify-between items-center mt-3">
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Language:</span> {ans?.language || "N/A"}
                            </p>
                            <div className="flex items-center gap-3">
                              {ans?.isCorrect !== undefined && (
                                <p className={`text-sm font-bold ${ans.isCorrect ? "text-green-600" : "text-red-600"}`}>
                                  {ans.isCorrect ? "Passed all test cases" : "Failed test cases"}
                                </p>
                              )}
                              <button
                                onClick={() => handleRetry(question, ans)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition text-xs font-bold border border-blue-200"
                                title="Open in Playground to debug"
                              >
                                <RotateCcw size={14} />
                                Retry
                              </button>
                            </div>
                          </div>

                          {/* Test Cases Details */}
                          {ans?.testCases && ans.testCases.length > 0 && (
                            <div className="mt-4 border-t pt-4">
                              <h5 className="text-sm font-semibold text-gray-800 mb-2">Test Case Results:</h5>
                              <div className="space-y-2">
                                {ans.testCases.map((tc, tcIdx) => (
                                  <div 
                                    key={tcIdx} 
                                    className={`p-3 rounded border text-xs font-mono ${
                                      tc.passed ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                                    }`}
                                  >
                                    <div className="flex justify-between mb-1">
                                      <span className="font-bold text-gray-700">Test Case #{tcIdx + 1}</span>
                                      <span className={`font-bold ${tc.passed ? "text-green-700" : "text-red-700"}`}>
                                        {tc.passed ? "PASSED" : "FAILED"}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <div>
                                        <span className="text-gray-500 block mb-0.5">Input:</span>
                                        <div className="bg-white p-1 rounded border overflow-x-auto whitespace-pre-wrap">{tc.input}</div>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block mb-0.5">Expected:</span>
                                        <div className="bg-white p-1 rounded border overflow-x-auto whitespace-pre-wrap">{tc.expectedOutput}</div>
                                      </div>
                                      <div>
                                        <span className="text-gray-500 block mb-0.5">Actual:</span>
                                        <div className="bg-white p-1 rounded border overflow-x-auto whitespace-pre-wrap">{tc.actualOutput}</div>
                                      </div>
                                    </div>
                                    {tc.error && (
                                      <div className="mt-2 text-red-600">
                                        <span className="font-bold">Error:</span> {tc.error}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-red-500 text-sm italic">Question type not supported or options missing</div>
                      )}
                    </div>
                    
                    <div className="mt-4 pl-8 flex items-center gap-2 text-sm text-gray-500">
                      <span>Marks:</span>
                      <span className={`font-bold ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                        {isCorrect ? `+1` : `0`} 
                      </span>
                    </div>
                  </div>
                );
              })}

              {questions.length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  No questions found for this exam.
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

      {/* Retry/Debug Modal */}
      {retryModalOpen && retryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <div>
                <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                  <Code size={20} className="text-blue-600" />
                  Debug Question
                </h3>
                <p className="text-sm text-gray-500 max-w-3xl truncate">
                  {retryData.question.question}
                </p>
              </div>
              <button 
                onClick={() => setRetryModalOpen(false)} 
                className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full transition text-gray-500"
              >
                <XCircle size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-0 relative flex flex-col">
              <CodingEnvironment 
                question={retryData.question} 
                initialData={retryData.initialData}
                onSave={() => {}} // No-op for debug mode
                layout="split-vertical"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultAnalysis;
