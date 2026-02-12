import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams, updateExam, deleteExam } from "../../api/examApi";

const ManageExams = () => {
  const [exams, setExams] = useState([]);
  const [editing, setEditing] = useState(null);

  async function loadExams() {
    const res = await getExams();
    setExams(res.data);
  }

  useEffect(() => {
    let canceled = false;

    (async () => {
      try {
        const res = await getExams();
        if (!canceled) setExams(res.data);
      } catch {
        toast.error("Failed to load exams");
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  const handleUpdate = async () => {
    try {
      await updateExam(editing._id, editing);
      toast.success("Exam updated");
      setEditing(null);
      loadExams();
    } catch (error) {
      const message = error.response?.data?.message || "Update failed";
      toast.error(message);
    }
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
                onClick={() => setEditing(exam)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
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




          {/* EDIT MODAL */}
          {editing && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
              <div className="bg-white p-6 rounded-xl w-96">
                <h3 className="font-bold mb-3">Edit Exam</h3>

                <input
                  className="w-full p-2 border mb-2"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />

                <input
                  type="number"
                  className="w-full p-2 border mb-2"
                  value={editing.duration}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      duration: e.target.value,
                    })
                  }
                />

                <input
                  type="number"
                  step="0.01"
                  className="w-full p-2 border mb-4"
                  value={editing.negativeMarking}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      negativeMarking: e.target.value,
                    })
                  }
                />

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditing(null)}
                    className="px-3 py-1 border rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    className="px-3 py-1 bg-blue-600 text-white rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageExams;
