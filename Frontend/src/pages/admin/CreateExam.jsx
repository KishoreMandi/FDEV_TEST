import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import axios from "../../api/axiosInstance";

const CreateExam = () => {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [negativeMarking, setNegativeMarking] = useState("0");
  const [isPublished, setIsPublished] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [attemptLimit, setAttemptLimit] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const diffMs = end - start;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins > 0) {
        setDuration(diffMins);
      } else {
        setDuration(""); // Reset if invalid or negative
      }
    }
  }, [startTime, endTime]);

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
        negativeMarking,
        isPublished,
        startTime: startTime ? new Date(startTime).toISOString() : null,
        endTime: endTime ? new Date(endTime).toISOString() : null,
        attemptLimit,
      });

      toast.success("Exam created successfully");

      setTitle("");
      setDuration("");
      setNegativeMarking("0");
      setIsPublished(false);
      setStartTime("");
      setEndTime("");
      setAttemptLimit(1);
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

            <input
              type="number"
              min="1"
              placeholder="Attempt Limit"
              className="w-full p-3 border rounded"
              value={attemptLimit}
              onChange={(e) => setAttemptLimit(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="datetime-local"
                  className="w-full p-3 border rounded"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="datetime-local"
                  className="w-full p-3 border rounded"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-5 h-5"
              />
              <label htmlFor="isPublished" className="font-medium">Publish Exam Immediately</label>
            </div>

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
