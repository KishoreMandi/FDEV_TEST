import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAnalytics } from "../../api/resultApi";
import toast from "react-hot-toast";

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
          
          <p className="text-gray-600 text-lg mb-8 leading-relaxed">
            Your exam is completed. Please wait, your results will be sent through mail.
          </p>

          <button
            onClick={() => navigate("/student/dashboard")}
            className="px-8 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition shadow-md"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Result;
