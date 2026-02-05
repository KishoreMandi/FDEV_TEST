import { useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import axios from "../../api/axiosInstance";

const CreateExam = () => {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [negativeMarking, setNegativeMarking] = useState("0");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !duration) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      await axios.post("/exams", {
        title,
        duration,
        negativeMarking, // sent as string, backend converts to Number
      });

      toast.success("Exam created successfully");

      setTitle("");
      setDuration("");
      setNegativeMarking("0");
    } catch {
      toast.error("Failed to create exam");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="ml-64 w-full min-h-screen bg-gray-100">
        <AdminHeader />

        <div className="p-6 max-w-xl">
          <h2 className="text-xl font-bold mb-4">Create Exam</h2>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow space-y-4"
          >
            <input
              placeholder="Exam Title"
              className="w-full p-3 border rounded"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <input
              type="number"
              placeholder="Duration (minutes)"
              className="w-full p-3 border rounded"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />

            {/* NEGATIVE MARKING FLOAT */}
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Negative Marking (e.g. 0.25)"
              className="w-full p-3 border rounded"
              value={negativeMarking}
              onChange={(e) => setNegativeMarking(e.target.value)}
            />

            <p className="text-sm text-gray-500">
              Example: 0.25 means ¼ mark deducted for each wrong answer
            </p>

            <button
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {loading ? "Creating..." : "Create Exam"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateExam;
