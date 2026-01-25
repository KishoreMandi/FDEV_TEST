import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams } from "../../api/examApi";
import axios from "../../api/axiosInstance";

const AddQuestions = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(null);

  useEffect(() => {
    getExams().then((res) => setExams(res.data));
  }, []);

  const handleOptionChange = (value, index) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!examId || correctOption === null) {
      toast.error("Please complete all fields");
      return;
    }

    try {
      await axios.post("/questions", {
        examId,
        question,
        options,
        correctOption,
      });

      toast.success("Question added successfully");

      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectOption(null);
    } catch {
      toast.error("Failed to add question");
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="ml-64 w-full min-h-screen bg-gray-100">
        <AdminHeader />

        <div className="p-6 max-w-3xl">
          <h2 className="text-xl font-bold mb-4">Add Question</h2>

          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-xl shadow space-y-4"
          >
            {/* Select Exam */}
            <select
              className="w-full p-3 border rounded"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              required
            >
              <option value="">Select Exam</option>
              {exams.map((exam) => (
                <option key={exam._id} value={exam._id}>
                  {exam.title}
                </option>
              ))}
            </select>

            {/* Question */}
            <textarea
              placeholder="Enter question"
              className="w-full p-3 border rounded"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />

            {/* Options */}
            {options.map((opt, index) => (
              <div key={index} className="flex items-center gap-3">
                <input
                  type="radio"
                  checked={correctOption === index}
                  onChange={() => setCorrectOption(index)}
                />
                <input
                  placeholder={`Option ${index + 1}`}
                  className="w-full p-2 border rounded"
                  value={opt}
                  onChange={(e) =>
                    handleOptionChange(e.target.value, index)
                  }
                  required
                />
              </div>
            ))}

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Add Question
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddQuestions;
