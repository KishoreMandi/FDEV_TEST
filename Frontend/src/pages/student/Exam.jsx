import { useEffect, useState, useRef } from "react";
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

  // PROCTORING STATE
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(true);
  const logsRef = useRef([]);
  const videoRef = useRef(null);

  const addLog = (type, message) => {
    logsRef.current.push({ type, message, timestamp: new Date() });
  };

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


  /* ================= PROCTORING LOGIC ================= */
  useEffect(() => {
    if (!exam) return;

    // 1. WEBCAM
    if (exam.proctoring?.webcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          toast.error("Webcam access required!");
          addLog("webcam_error", "Failed to access webcam");
        });
    }

    // 2. FULLSCREEN
    if (exam.proctoring?.fullScreen) {
      const handleFullScreenChange = () => {
        const isFull = !!document.fullscreenElement;
        setIsFullScreen(isFull);
        if (!isFull) {
            addLog("fullscreen_exit", "Exited fullscreen");
        }
      };
      document.addEventListener("fullscreenchange", handleFullScreenChange);
      
      return () => document.removeEventListener("fullscreenchange", handleFullScreenChange);
    }
  }, [exam]);

  // 3. TAB SWITCH
  useEffect(() => {
      if (!exam?.proctoring?.tabSwitch) return;

      const handleVisibilityChange = () => {
        if (document.hidden) {
          const newCount = tabSwitches + 1;
          setTabSwitches(newCount);
          addLog("tab_switch", `Tab switched. Violation ${newCount}`);
          
          const limit = exam.proctoring.tabSwitchLimit || 3;
          if (newCount >= limit) {
             toast.error("Max violations reached. Submitting...");
             finalSubmit();
          } else {
             toast.error(`Warning: Tab switch detected! (${newCount}/${limit})`);
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [exam, tabSwitches]);

  // 4. COPY-PASTE BLOCK
  useEffect(() => {
      const handlePrevent = (e) => {
          e.preventDefault();
          toast.error("Action not allowed!");
          addLog("copy_paste", "Attempted copy/paste/contextmenu");
      };

      document.addEventListener("contextmenu", handlePrevent);
      document.addEventListener("copy", handlePrevent);
      document.addEventListener("paste", handlePrevent);
      document.addEventListener("cut", handlePrevent);

      return () => {
          document.removeEventListener("contextmenu", handlePrevent);
          document.removeEventListener("copy", handlePrevent);
          document.removeEventListener("paste", handlePrevent);
          document.removeEventListener("cut", handlePrevent);
      };
  }, []);

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
        activityLogs: logsRef.current,
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
        activityLogs: logsRef.current,
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
  const enterFullScreen = () => {
      document.documentElement.requestFullscreen().catch(console.error);
  };

  if (exam?.proctoring?.fullScreen && !isFullScreen) {
      return (
          <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 text-white">
              <h2 className="text-2xl font-bold mb-4">Fullscreen Required</h2>
              <p className="mb-6">You must be in fullscreen mode to take this exam.</p>
              <button 
                  onClick={enterFullScreen}
                  className="px-6 py-3 bg-blue-600 rounded font-bold hover:bg-blue-700"
              >
                  Enter Fullscreen
              </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* WEBCAM FEED */}
      {exam?.proctoring?.webcam && (
          <div className="fixed bottom-4 right-4 w-48 h-36 bg-black border-2 border-white shadow-lg z-50 rounded overflow-hidden">
              <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  className="w-full h-full object-cover"
              />
          </div>
      )}

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
