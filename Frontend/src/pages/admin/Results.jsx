import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams } from "../../api/examApi";
import axios from "../../api/axiosInstance";

const Results = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [results, setResults] = useState([]);

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
    <div className="flex">
      <AdminSidebar />

      <div className="ml-64 w-full min-h-screen bg-gray-100">
        <AdminHeader />

        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Exam Results</h2>

          <select
            className="p-3 border rounded mb-4"
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

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Student</th>
                  <th className="p-3 text-left">Score</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Recordings</th>
                </tr>
              </thead>

              <tbody>
                {results.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-3">{r.studentId.name}</td>
                    <td className="p-3">{r.score ?? "-"}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          r.status === "submitted"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-3 space-x-2">
                      {r.webcamRecording && (
                        <a 
                          href={`${BASE_URL}/${r.webcamRecording}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 underline text-xs"
                        >
                          Webcam
                        </a>
                      )}
                      {r.screenRecording && (
                        <a 
                          href={`${BASE_URL}/${r.screenRecording}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-purple-600 underline text-xs"
                        >
                          Screen
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {results.length === 0 && examId && (
              <p className="p-4 text-gray-500">
                No attempts yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
