import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Eye } from "lucide-react";
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

  useEffect(() => {
    getExams().then((res) => setExams(res.data));
  }, []);

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
                </tr>
              </thead>

              <tbody>
                {results.map((r) => (
                  <tr key={r._id} className="border-t">
                    <td className="p-3">
                      <div>{r.studentId.name}</div>
                      {r.studentId.employeeId && (
                        <div className="text-xs text-gray-500">ID: {r.studentId.employeeId}</div>
                      )}
                    </td>
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
                    <td className="p-3">
                      <button
                        onClick={() => navigate(`/trainer/result-analysis/${r._id}`)}
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
