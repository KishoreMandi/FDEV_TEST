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
  const [marked, setMarked] = useState(new Set()); // Stores indices
  const [current, setCurrent] = useState(0);
  const [showSubmit, setShowSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialSeconds, setInitialSeconds] = useState(null);

  // Store exam data
  const [exam, setExam] = useState(null);

  // PROCTORING STATE
  const [tabSwitches, setTabSwitches] = useState(0);
  const [deviceViolations, setDeviceViolations] = useState(0); // Track device issues
  const [isFullScreen, setIsFullScreen] = useState(false);
  const logsRef = useRef([]);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null); // Store stream for monitoring
  const finalSubmitRef = useRef(null); // Ref for finalSubmit to avoid stale closures in intervals
  const canvasRef = useRef(document.createElement("canvas")); // Off-screen canvas for analysis

  // RECORDING REFS
  const webcamRecorderRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const webcamChunksRef = useRef([]);
  const screenChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const audioContextRef = useRef(null); // Store AudioContext to close it later
  const [hasScreenShare, setHasScreenShare] = useState(false);

  const addLog = (type, message) => {
    logsRef.current.push({ type, message, timestamp: new Date() });
  };

  /* ================= PREVENT NAVIGATION ================= */
  useEffect(() => {
    // 1. Push state to prevent back navigation
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = (event) => {
      window.history.pushState(null, document.title, window.location.href);
      toast.error("Navigation is disabled during the exam!");
    };

    // 2. Prevent Refresh/Close
    const handleBeforeUnload = (e) => {
       e.preventDefault(); 
       e.returnValue = "Are you sure you want to leave? Your exam will be submitted.";
       return e.returnValue;
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  /* ================= LOAD QUESTIONS + RESUME ================= */
  useEffect(() => {
    const loadExam = async () => {
      try {
        const examRes = await axios.get(`/exams/${examId}`);
        setExam(examRes.data);
        console.log("EXAM OBJECT FROM BACKEND:", examRes.data);

        const qRes = await getQuestions(examId);
        setQuestions(qRes.data);

        const saved = await resumeExam(examId);
        
        if (saved.data) {
          // Check if already submitted
          if (saved.data.status === "submitted") {
             toast.error("You have already completed this exam.");
             navigate(`/student/result/${examId}`, { replace: true });
             return;
          }

          // Restore Answers
          if (saved.data.answers) {
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

          // Restore Marked for Review
          if (saved.data.markedForReview) {
            const restoredMarked = new Set();
            saved.data.markedForReview.forEach((qId) => {
              const index = qRes.data.findIndex((q) => q._id === qId);
              if (index !== -1) restoredMarked.add(index);
            });
            setMarked(restoredMarked);
          }

          // Restore Timer
          if (saved.data.startedAt) {
             const elapsed = Math.floor((Date.now() - new Date(saved.data.startedAt).getTime()) / 1000);
             const durationSeconds = examRes.data.duration * 60;
             const remaining = durationSeconds - elapsed;
             setInitialSeconds(remaining > 0 ? remaining : 0);
          } else {
             // Should not happen if saved data exists but startedAt is missing, fallback
             setInitialSeconds(examRes.data.duration * 60);
          }
        } else {
          // New Attempt
          setInitialSeconds(examRes.data.duration * 60);
        }

      } catch (error) {
        toast.error("Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);


  /* ================= STOP MEDIA ================= */
  const stopMediaStream = () => {
    // 1. Stop from Ref
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      mediaStreamRef.current = null;
    }
    
    // 2. Stop from Video Element (failsafe for orphans)
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      if (stream.getTracks) {
        stream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      }
      videoRef.current.srcObject = null;
    }

    // 3. Stop Screen Stream
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      screenStreamRef.current = null;
    }

    // 4. Close AudioContext
    if (audioContextRef.current) {
        audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e));
        audioContextRef.current = null;
    }
  };

  /* ================= PROCTORING LOGIC ================= */
  useEffect(() => {
    if (!exam) return;

    let isMounted = true;

    // 1. WEBCAM & MIC SETUP
    if (exam.proctoring?.webcam) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (!isMounted) {
            // Unmounted before stream ready -> kill it immediately
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch(() => {});
          }

          // START RECORDING
          const mimeTypes = [
              "video/webm;codecs=vp9,opus",
              "video/webm;codecs=vp8,opus",
              "video/webm"
          ];
          const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

          if (selectedMimeType) {
             const recorder = new MediaRecorder(stream, { 
                 mimeType: selectedMimeType,
                 audioBitsPerSecond: 128000,
                 videoBitsPerSecond: 1000000 // Webcam needs less bandwidth
             });
             recorder.ondataavailable = (e) => {
                if (e.data.size > 0) webcamChunksRef.current.push(e.data);
             };
             recorder.start(1000); 
             webcamRecorderRef.current = recorder;
          }
        })
        .catch(() => {
          if (!isMounted) return;
          toast.error("Webcam/Mic access required!");
          addLog("webcam_error", "Failed to access webcam/mic");
        });
    }

    // 2. FULLSCREEN
    let handleFullScreenChange;
    if (exam.proctoring?.fullScreen) {
      handleFullScreenChange = () => {
        const isFull = !!document.fullscreenElement;
        setIsFullScreen(isFull);
        if (!isFull) {
            addLog("fullscreen_exit", "Exited fullscreen");
        }
      };
      document.addEventListener("fullscreenchange", handleFullScreenChange);
    }

    // CLEANUP
    return () => {
      isMounted = false;
      stopMediaStream();
      if (handleFullScreenChange) {
        document.removeEventListener("fullscreenchange", handleFullScreenChange);
      }
    };
  }, [exam]);

  // Re-attach stream when video element mounts (e.g. after entering fullscreen)
  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
      videoRef.current.play().catch(e => console.error("Play error:", e));
    }
  }, [isFullScreen, exam]);

  // 3. DEVICE MONITORING (Video/Mic + Black Screen Detection)
  useEffect(() => {
    if (!exam?.proctoring?.webcam) return;

    const interval = setInterval(() => {
      const stream = mediaStreamRef.current;
      const videoEl = videoRef.current;

      let issue = null;

      // Check 1: Stream integrity
      if (!stream) {
        issue = "Camera disconnected";
      } else {
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        if (!videoTrack || videoTrack.readyState !== 'live' || !videoTrack.enabled || videoTrack.muted) {
           issue = "Camera is off or blocked";
        } else if (!audioTrack || audioTrack.readyState !== 'live' || !audioTrack.enabled || audioTrack.muted) {
           issue = "Microphone is off or blocked";
        }
      }

      // Check 2: Video Signal Analysis (Black Screen Detection)
      if (!issue && videoEl && videoEl.readyState === 4) { // 4 = HAVE_ENOUGH_DATA
         try {
           const canvas = canvasRef.current;
           const ctx = canvas.getContext('2d', { willReadFrequently: true });
           canvas.width = 100; // Low res for performance
           canvas.height = 100;
           
           ctx.drawImage(videoEl, 0, 0, 100, 100);
           const frame = ctx.getImageData(0, 0, 100, 100);
           const data = frame.data;
           
           let totalBrightness = 0;
           for (let i = 0; i < data.length; i += 4) {
             // Calculate brightness: (R + G + B) / 3
             totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
           }
           
           const avgBrightness = totalBrightness / (data.length / 4);
           
           // Threshold for "black screen". 
           // Completely black is 0. A covered camera usually produces noise < 10-15.
           if (avgBrightness < 10) { 
             issue = "Camera is blank. Please set the camera properly";
           }
         } catch (e) {
           console.error("Video analysis error:", e);
         }
      }

      if (issue) {
         setDeviceViolations(prev => {
            const newCount = prev + 1;
            addLog("device_violation", `${issue}. Count: ${newCount}`);
            
            // "after 2 warnings submit" -> 3rd strike submits
             if (newCount > 2) { 
                // Prevent multiple submits if already submitting
                if (newCount === 3) {
                  toast.error("Max violations reached. Auto-submitting...");
                  if (finalSubmitRef.current) {
                    finalSubmitRef.current();
                  }
                }
             } else {
               toast.error(`${issue}! Warning ${newCount}/2`, {
                 duration: 4000, // Show longer
                 icon: '⚠️',
               });
            }
            return newCount;
         });
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [exam]);

  // 4. TAB SWITCH
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
             if (finalSubmitRef.current) {
               finalSubmitRef.current();
             }
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
  const triggerAutoSave = async () => {
    try {
      await autoSave({
        examId,
        answers: Object.entries(answers).map(
          ([index, option]) => ({
            questionId: questions[index]._id,
            selectedOption: option,
          })
        ),
        markedForReview: Array.from(marked).map(idx => questions[idx]._id),
        activityLogs: logsRef.current,
      });
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  };

  useEffect(() => {
    if (questions.length === 0) return;

    const interval = setInterval(() => {
      // Always auto-save to ensure session heartbeat and timer sync
      triggerAutoSave();
    }, 5000);

    return () => clearInterval(interval);
  }, [answers, questions, examId, marked]);

  /* ================= HANDLE ACTIONS ================= */
  const handleSelect = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [current]: optionIndex,
    }));
  };

  const toggleMark = () => {
    setMarked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(current)) newSet.delete(current);
      else newSet.add(current);
      return newSet;
    });
  };

  const handleSaveAndNext = async () => {
    await triggerAutoSave();
    setCurrent((p) => p + 1);
  };

  /* ================= RECORDING HELPERS ================= */
  const stopRecorder = (recorder, chunksRef) => {
    return new Promise((resolve) => {
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob(chunksRef.current, { type: "video/webm" }));
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        resolve(blob);
      };
      recorder.stop();
    });
  };

  const uploadRecordings = async () => {
    try {
      const formData = new FormData();
      formData.append("examId", examId);

      // Stop & Collect Webcam
      if (webcamRecorderRef.current) {
        const webcamBlob = await stopRecorder(webcamRecorderRef.current, webcamChunksRef);
        if (webcamBlob.size > 0) {
          formData.append("webcam", webcamBlob, "webcam.webm");
        }
      }

      // Stop & Collect Screen
      if (screenRecorderRef.current) {
        const screenBlob = await stopRecorder(screenRecorderRef.current, screenChunksRef);
        if (screenBlob.size > 0) {
           formData.append("screen", screenBlob, "screen.webm");
        }
      }
      
      if (formData.has("webcam") || formData.has("screen")) {
          const toastId = toast.loading("Uploading exam recordings...");
          await axios.post("/results/upload-recording", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          toast.dismiss(toastId);
      }

    } catch (error) {
      console.error("Upload error:", error);
      // Don't block submission on upload fail, but warn
      toast.error("Recording upload failed.");
    }
  };

  /* ================= FINAL SUBMIT ================= */
  const finalSubmit = async () => {
    try {
      // 1. Upload Recordings
      await uploadRecordings();

      // 2. Stop Camera/Mic/Screen
      stopMediaStream();
      
      // Exit Fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }

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

  // Keep finalSubmitRef updated
  useEffect(() => {
    finalSubmitRef.current = finalSubmit;
  });

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

  const enableScreenShare = async () => {
      try {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
              video: { cursor: "always" }, 
              audio: true 
          });

          let finalStream = screenStream;
          const audioTracks = [];

          // 1. Get System Audio (if shared)
          const systemAudioTrack = screenStream.getAudioTracks()[0];
          if (systemAudioTrack) {
              audioTracks.push(systemAudioTrack);
          }

          // 2. Get Mic Audio (from webcam stream)
          if (mediaStreamRef.current) {
             const micTrack = mediaStreamRef.current.getAudioTracks()[0];
             if (micTrack) {
                audioTracks.push(micTrack);
             }
          }

          // 3. Mix Audio if multiple sources exist
          if (audioTracks.length > 0) {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              audioContextRef.current = audioContext; // Store ref
              const destination = audioContext.createMediaStreamDestination();

              if (systemAudioTrack) {
                  const systemSource = audioContext.createMediaStreamSource(new MediaStream([systemAudioTrack]));
                  systemSource.connect(destination);
              }

              if (audioTracks.length > 1 || (audioTracks.length === 1 && !systemAudioTrack)) {
                   // If we have mic track (either alone or with system)
                   const micTrack = audioTracks.find(t => t !== systemAudioTrack);
                   if (micTrack) {
                       const micSource = audioContext.createMediaStreamSource(new MediaStream([micTrack]));
                       micSource.connect(destination);
                   }
              }

              const mixedAudioTrack = destination.stream.getAudioTracks()[0];
              finalStream = new MediaStream([
                  screenStream.getVideoTracks()[0], 
                  mixedAudioTrack
              ]);
          }

          // Ensure we stop ALL tracks (Original System Audio + Mixed Audio + Video)
          // We create a "master" stream for cleanup purposes that contains all tracks we touched
          const tracksToCleanup = [...finalStream.getTracks()];
          if (systemAudioTrack && !tracksToCleanup.includes(systemAudioTrack)) {
             tracksToCleanup.push(systemAudioTrack);
          }
          
          screenStreamRef.current = new MediaStream(tracksToCleanup);
          setHasScreenShare(true);
          
          const mimeTypes = [
              "video/webm;codecs=vp9,opus",
              "video/webm;codecs=vp8,opus",
              "video/webm"
          ];
          const selectedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type));

          if (selectedMimeType) {
             const recorder = new MediaRecorder(finalStream, { 
                 mimeType: selectedMimeType,
                 audioBitsPerSecond: 128000,
                 videoBitsPerSecond: 2500000
             });
             recorder.ondataavailable = (e) => {
                if (e.data.size > 0) screenChunksRef.current.push(e.data);
             };
             recorder.start(1000);
             screenRecorderRef.current = recorder;
          }
          
          // Listen for stop on the original screen stream video track
          screenStream.getVideoTracks()[0].onended = () => {
              toast.error("Screen sharing stopped! Exam will be submitted.");
              if (finalSubmitRef.current) finalSubmitRef.current();
          };
      } catch (err) {
          console.error(err);
          toast.error("Screen sharing is required!");
      }
  };

  if (exam?.proctoring?.screenRecording && !hasScreenShare) {
      return (
          <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-50 text-white">
              <h2 className="text-2xl font-bold mb-4">Screen Share Required</h2>
              <p className="mb-6">This exam requires screen recording. Please enable screen sharing to proceed.</p>
              <button 
                  onClick={enableScreenShare}
                  className="px-6 py-3 bg-blue-600 rounded font-bold hover:bg-blue-700"
              >
                  Enable Screen Share
              </button>
          </div>
      );
  }

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
          <div className="fixed bottom-24 right-4 w-48 h-36 bg-black border-2 border-white shadow-lg z-50 rounded overflow-hidden">
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

        {/* TIMER */}
        {initialSeconds !== null && (
          <Timer
            initialSeconds={initialSeconds}
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

            <div className="space-x-2">
               <button
                onClick={toggleMark}
                className={`px-4 py-2 rounded text-white ${marked.has(current) ? 'bg-purple-600' : 'bg-yellow-500'}`}
               >
                 {marked.has(current) ? "Unmark" : "Mark for Review"}
               </button>

               <button
                onClick={handleSaveAndNext}
                disabled={current === questions.length - 1}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
               >
                Save & Next
               </button>
            </div>
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
            marked={marked}
          />
          
          {/* Legend */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
             <div className="flex items-center"><span className="w-3 h-3 bg-green-500 mr-1 rounded"></span> Answered</div>
             <div className="flex items-center"><span className="w-3 h-3 bg-purple-600 mr-1 rounded"></span> Marked</div>
             <div className="flex items-center"><span className="w-3 h-3 bg-yellow-400 mr-1 rounded border border-blue-600"></span> Current</div>
             <div className="flex items-center"><span className="w-3 h-3 bg-gray-300 mr-1 rounded"></span> Not Visited</div>
          </div>

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
