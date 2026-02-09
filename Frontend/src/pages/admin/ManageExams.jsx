import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams, deleteExam } from "../../api/examApi";

const ManageExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    const res = await getExams();
    setExams(res.data);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this exam?")) return;

    try {
      await deleteExam(id);
      toast.success("Exam deleted");
      loadExams();
    } catch {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full min-h-screen bg-gray-100">
        <AdminHeader />

        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Manage Exams</h2>

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left w-[45%]">Exam Title</th>
                  <th className="p-3 text-center w-[15%]">Duration (min)</th>
                  <th className="p-3 text-center w-[15%]">Negative</th>
                  <th className="p-3 text-center w-[25%]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {exams.map((exam) => (
                  <tr
                    key={exam._id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    {/* TITLE */}
                    <td className="p-3 font-medium truncate">
                      {exam.title}
                    </td>

                    {/* DURATION */}
                    <td className="p-3 text-center">
                      {exam.duration}
                    </td>

                    {/* NEGATIVE MARKING */}
                    <td className="p-3 text-center">
                      {exam.negativeMarking}
                    </td>

                    {/* ACTIONS */}
                    <td className="p-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/edit-exam/${exam._id}`)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Click here to publish exam
                        </button>

                        <button
                          onClick={() => handleDelete(exam._id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageExams;