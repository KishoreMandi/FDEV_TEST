import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAnalytics } from "../../api/resultApi";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";

const Result = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    getAnalytics(examId)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Failed to load result"));
  }, [examId]);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading result...
      </div>
    );
  }

  const codingAnswers = data.answers?.filter(ans => ans.code) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full">
        {/* SUMMARY CARD */}
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center mb-8">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-10 h-10 text-green-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            Exam Completed
          </h1>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-sm text-blue-600 font-medium uppercase">Score</p>
              <p className="text-2xl font-bold text-blue-800">{data.score}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <p className="text-sm text-green-600 font-medium uppercase">Correct</p>
              <p className="text-2xl font-bold text-green-800">{data.correct}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl">
              <p className="text-sm text-red-600 font-medium uppercase">Wrong</p>
              <p className="text-2xl font-bold text-red-800">{data.wrong}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl">
              <p className="text-sm text-purple-600 font-medium uppercase">Accuracy</p>
              <p className="text-2xl font-bold text-purple-800">{data.accuracy}%</p>
            </div>
          </div>

          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Your test is complete. You can review your coding submissions below.
          </p>

          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-8 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition shadow-md"
          >
            Back to Dashboard
          </button>
        </div>

        {/* CODING SUBMISSIONS */}
        {codingAnswers.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 px-2">Coding Submissions</h2>
            {codingAnswers.map((ans, idx) => (
              <div key={ans.questionId} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-semibold text-lg text-gray-800">Question {idx + 1}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${ans.isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {ans.isCorrect ? 'Passed All Tests' : 'Failed Tests'}
                  </span>
                </div>
                <div className="p-0">
                  <Editor
                    height="300px"
                    language={ans.language || "javascript"}
                    value={ans.code}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
                <div className="p-4 bg-gray-50 flex justify-between text-sm text-gray-500">
                  <span>Language: <span className="font-mono text-gray-700">{ans.language}</span></span>
                  <span>Points: <span className="font-bold text-gray-700">{ans.isCorrect ? 5 : 0}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Result;
