import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/axiosInstance";

import Timer from "../../components/Timer";
import QuestionCard from "../../components/QuestionCard";
import QuestionPalette from "../../components/QuestionPalette";
import SubmitModal from "../../components/SubmitModal";

import { getQuestions } from "../../api/examApi";
import { autoSave, resumeExam, submitExam } from "../../api/resultApi";

const Exam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [loading, setLoading] = useState(true);

  // ✅ NEW: store exam data (only for duration)
  const [exam, setExam] = useState(null);

  /* ================= LOAD QUESTIONS + RESUME ================= */
  useEffect(() => {
    const loadExam = async () => {
      try {
        // ✅ fetch exam to get admin-set duration
        const examRes = await axios.get(`/exams/${examId}`);
        setExam(examRes.data);
        console.log("EXAM OBJECT FROM BACKEND:", examRes.data);


        const qRes = await getQuestions(examId);
        setQuestions(qRes.data);

        const saved = await resumeExam(examId);
        if (saved.data?.answers) {
          const restored = {};
          saved.data.answers.forEach((a) => {
            const index = qRes.data.findIndex(
              (q) => q._id === a.questionId
            );
            if (index !== -1) {
              restored[index] = a.selectedOption;
            }
          });
          setAnswers(restored);
        }
      } catch (error) {
        toast.error("Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);


  /* ================= AUTO SAVE ANSWERS ================= */
  useEffect(() => {
    if (questions.length === 0) return;

    const interval = setInterval(() => {
      if (Object.keys(answers).length === 0) return;

      autoSave({
        examId,
        answers: Object.entries(answers).map(
          ([index, option]) => ({
            questionId: questions[index]._id,
            selectedOption: option,
          })
        ),
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [answers, questions, examId]);

  /* ================= HANDLE ANSWER ================= */
  const handleSelect = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [current]: optionIndex,
    }));
  };

  /* ================= FINAL SUBMIT ================= */
  const finalSubmit = async () => {
    try {
      await submitExam({
        examId,
        answers: Object.entries(answers).map(
          ([index, option]) => ({
            questionId: questions[index]._id,
            selectedOption: option,
          })
        ),
      });

      toast.success("Exam submitted successfully");
      navigate(`/student/result/${examId}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit exam");
    }
  };

  /* ================= AUTO SUBMIT ON TIME UP ================= */
  const handleTimeUp = () => {
    toast.error("Time is up! Exam auto-submitted.");
    finalSubmit();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading exam...
      </div>
    );
  }


  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold text-lg">Online Examination</h1>

        {/* ✅ FIXED: ADMIN-SET DURATION */}
        {exam && (
          <Timer
            duration={exam.duration}
            onTimeUp={handleTimeUp}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Question Area */}
        <div className="md:col-span-3">
          {questions[current] && (
            <QuestionCard
              question={questions[current]}
              selectedOption={answers[current]}
              onSelect={handleSelect}
            />
          )}

          <div className="flex justify-between mt-4">
            <button
              disabled={current === 0}
              onClick={() => setCurrent((p) => p - 1)}
              className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
            >
              Previous
            </button>

            <button
              onClick={() => setCurrent((p) => p + 1)}
              disabled={current === questions.length - 1}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              Save & Next
            </button>
          </div>
        </div>

        {/* Palette */}
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Questions</h3>

          <QuestionPalette
            total={questions.length}
            answers={answers}
            current={current}
            onSelect={setCurrent}
          />

          <button
            onClick={() => setShowSubmit(true)}
            className="mt-4 w-full bg-red-600 text-white py-2 rounded"
          >
            Submit Exam
          </button>
        </div>
      </div>

      {/* Submit Confirmation */}
      <SubmitModal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        attempted={Object.keys(answers).length}
        total={questions.length}
        onConfirm={finalSubmit}
      />
    </div>
  );
};

export default Exam;
