import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams, updateExam, deleteExam } from "../../api/examApi";

const ManageExams = () => {
  const [exams, setExams] = useState([]);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    const res = await getExams();
    setExams(res.data);
  };

  const formatDateTimeLocal = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
  };

  const handleEditClick = (exam) => {
    setEditing({
      ...exam,
      startTime: exam.startTime ? formatDateTimeLocal(exam.startTime) : "",
      endTime: exam.endTime ? formatDateTimeLocal(exam.endTime) : "",
    });
  };

  const handleDateChange = (field, value) => {
    const newState = { ...editing, [field]: value };
    
    if (newState.startTime && newState.endTime) {
      const start = new Date(newState.startTime);
      const end = new Date(newState.endTime);
      const diffMs = end - start;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins > 0) {
        newState.duration = diffMins;
      }
    }
    setEditing(newState);
  };

  const handleUpdate = async () => {
    try {
      const payload = {
        ...editing,
        startTime: editing.startTime ? new Date(editing.startTime).toISOString() : null,
        endTime: editing.endTime ? new Date(editing.endTime).toISOString() : null,
      };
      await updateExam(editing._id, payload);
      toast.success("Exam updated");
      setEditing(null);
      loadExams();
    } catch {
      toast.error("Update failed");
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
                onClick={() => handleEditClick(exam)}
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

                <input
                  type="number"
                  min="1"
                  placeholder="Attempt Limit"
                  className="w-full p-2 border mb-2"
                  value={editing.attemptLimit || 1}
                  onChange={(e) =>
                    setEditing({ ...editing, attemptLimit: e.target.value })
                  }
                />

                <div className="mb-2">
                    <label className="text-xs text-gray-500">Start Time</label>
                    <input
                    type="datetime-local"
                    className="w-full p-2 border"
                    value={editing.startTime}
                    onChange={(e) => handleDateChange("startTime", e.target.value)}
                    />
                </div>

                <div className="mb-2">
                    <label className="text-xs text-gray-500">End Time</label>
                    <input
                    type="datetime-local"
                    className="w-full p-2 border"
                    value={editing.endTime}
                    onChange={(e) => handleDateChange("endTime", e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <input
                    type="checkbox"
                    id="edit-published"
                    checked={editing.isPublished || false}
                    onChange={(e) =>
                      setEditing({ ...editing, isPublished: e.target.checked })
                    }
                  />
                  <label htmlFor="edit-published">Published</label>
                </div>

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
