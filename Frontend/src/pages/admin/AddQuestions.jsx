import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams, getAdminQuestions, updateQuestion, deleteQuestion } from "../../api/examApi";
import axios from "../../api/axiosInstance";

const AddQuestions = () => {
  const [exams, setExams] = useState([]);
  const [examId, setExamId] = useState("");
  const [questionsList, setQuestionsList] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctOption, setCorrectOption] = useState(null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    getExams().then((res) => setExams(res.data));
  }, []);

  useEffect(() => {
    if (examId) {
      // Find current exam status
      const selectedExam = exams.find((e) => e._id === examId);
      if (selectedExam && selectedExam.isPublished) {
        setIsPublished(true);
        toast.error("Your exam is already published, unable to add questions");
      } else {
        setIsPublished(false);
      }
      fetchQuestions();
    } else {
      setQuestionsList([]);
      setIsPublished(false);
    }
  }, [examId, exams]);

  const fetchQuestions = async () => {
    try {
      const res = await getAdminQuestions(examId);
      setQuestionsList(res.data);
    } catch (error) {
      console.error("Failed to fetch questions", error);
    }
  };

  const handleOptionChange = (value, index) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleEdit = (q) => {
    if (isPublished) {
      toast.error("Your exam is already published, unable to edit questions");
      return;
    }
    setEditingId(q._id);
    setQuestion(q.question);
    setOptions(q.options);
    setCorrectOption(q.correctOption);
    window.scrollTo(0, 0);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setCorrectOption(null);
  };

  const handleDelete = async (id) => {
    if (isPublished) {
      toast.error("Your exam is already published, unable to delete questions");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await deleteQuestion(id);
      toast.success("Question deleted");
      fetchQuestions();
    } catch {
      toast.error("Failed to delete question");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPublished) {
      toast.error("Your exam is already published, unable to add questions");
      return;
    }

    if (!examId || correctOption === null) {
      toast.error("Please complete all fields");
      return;
    }

    try {
      if (editingId) {
        await updateQuestion(editingId, {
          question,
          options,
          correctOption,
        });
        toast.success("Question updated successfully");
        setEditingId(null);
      } else {
        await axios.post("/questions", {
          examId,
          question,
          options,
          correctOption,
        });
        toast.success("Question added successfully");
      }

      setQuestion("");
      setOptions(["", "", "", ""]);
      setCorrectOption(null);
      fetchQuestions();
    } catch (error) {
       toast.error(error.response?.data?.message || "Failed to save question");
    }
  };

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="ml-64 w-full min-h-screen bg-gray-100">
        <AdminHeader />

        <div className="p-6 max-w-3xl">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? "Edit Question" : "Add Question"}
          </h2>
          
          {isPublished && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
              <p className="font-bold">Notice</p>
              <p>Your exam is already published. You cannot add, edit, or delete questions.</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className={`bg-white p-6 rounded-xl shadow space-y-4 mb-8 ${isPublished ? "opacity-50 pointer-events-none" : ""}`}
          >
            {/* Select Exam */}
            <select
              className="w-full p-3 border rounded"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              required
              disabled={!!editingId}
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

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingId ? "Update Question" : "Add Question"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Questions List */}
          {examId && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">
                Questions ({questionsList.length})
              </h3>
              {questionsList.map((q, i) => (
                <div key={q._id} className="bg-white p-4 rounded-xl shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">
                      Q{i + 1}: {q.question}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(q)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(q._id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <ul className="pl-4 space-y-1">
                    {q.options.map((opt, idx) => (
                      <li
                        key={idx}
                        className={`${
                          q.correctOption === idx
                            ? "text-green-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {idx + 1}. {opt} {q.correctOption === idx && "(Correct)"}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {questionsList.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No questions added yet for this exam.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddQuestions;
