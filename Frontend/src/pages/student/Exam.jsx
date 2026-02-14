import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axios from "../../api/axiosInstance";
import { Maximize2, Minimize2, Move, Camera, User as UserIcon } from "lucide-react";
import * as faceapi from '@vladmandic/face-api';

import Timer from "../../components/Timer";
import QuestionCard from "../../components/QuestionCard";
import QuestionPalette from "../../components/QuestionPalette";
import SubmitModal from "../../components/SubmitModal";
import CodingEnvironment from "../../components/CodingEnvironment";

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
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialSeconds, setInitialSeconds] = useState(null);

  // Store exam data
  const [exam, setExam] = useState(null);

  // FACE DETECTION STATE
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // PROCTORING STATE
  const [tabSwitches, setTabSwitches] = useState(0);
  const [_deviceViolations, setDeviceViolations] = useState(0); 
  const deviceViolationRef = useRef(false); // Ref to track state without closure issues
  const [multiPersonViolations, setMultiPersonViolations] = useState(0);
  const multiPersonRef = useRef(false); // Ref to track state without closure issues
  const [headTurnViolations, setHeadTurnViolations] = useState(0);
  const headTurnRef = useRef(false); // Ref to track state without closure issues
  const [outOfFrameViolations, setOutOfFrameViolations] = useState(0);
  const outOfFrameRef = useRef(false); // Ref to track state without closure issues
  const [isMultiplePersons, setIsMultiplePersons] = useState(false);
  const [isHeadTurned, setIsHeadTurned] = useState(false);
  const [isOutOfFrame, setIsOutOfFrame] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const lastFullScreenRef = useRef(false);
  const lastWarningTimeRef = useRef(0);
  const logsRef = useRef([]);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null); // Store stream for monitoring
  const finalSubmitRef = useRef(null); // Ref for finalSubmit to avoid stale closures in intervals
  const canvasRef = useRef(document.createElement("canvas")); // Off-screen canvas for analysis
  const submittingRef = useRef(false);
  const lastFaceLogTimeRef = useRef(0); // For 5-second logging
  const answersRef = useRef({});
  const markedRef = useRef(new Set());
  const questionsRef = useRef([]);

  // RECORDING REFS
  const webcamRecorderRef = useRef(null);
  const screenRecorderRef = useRef(null);
  const webcamChunksRef = useRef([]);
  const screenChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const audioContextRef = useRef(null); // Store AudioContext to close it later
  const [hasScreenShare, setHasScreenShare] = useState(false);

  // CAMERA DRAG STATE
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleDragStart = (e) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX - cameraPos.x, y: e.clientY - cameraPos.y };
  };

  useEffect(() => {
    const handleDragMove = (e) => {
      if (!isDraggingRef.current) return;
      const newX = e.clientX - dragStartRef.current.x;
      const newY = e.clientY - dragStartRef.current.y;
      setCameraPos({ x: newX, y: newY });
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, []);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  useEffect(() => {
    markedRef.current = marked;
  }, [marked]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  const addLog = (type, message) => {
    logsRef.current.push({ type, message, timestamp: new Date() });
  };

  /* ================= PREVENT NAVIGATION ================= */
  useEffect(() => {
    // 1. Push state to prevent back navigation
    window.history.pushState(null, document.title, window.location.href);

    const handlePopState = () => {
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

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;

    const prevStyles = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
      htmlTouchAction: html.style.touchAction,
      bodyTouchAction: body.style.touchAction,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    html.style.touchAction = "pan-x pan-y";
    body.style.touchAction = "pan-x pan-y";

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };

    const handleKeyDown = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;

      const zoomKeys = new Set(["+", "=", "-", "_", "0"]);
      if (zoomKeys.has(e.key)) {
        e.preventDefault();
        return;
      }

      const zoomCodes = new Set(["NumpadAdd", "NumpadSubtract"]);
      if (zoomCodes.has(e.code)) {
        e.preventDefault();
      }
    };

    const handleGesture = (e) => {
      e.preventDefault();
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches.length > 1) e.preventDefault();
    };

    const handleDblClick = (e) => {
      e.preventDefault();
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("gesturestart", handleGesture, { passive: false });
    window.addEventListener("gesturechange", handleGesture, { passive: false });
    window.addEventListener("gestureend", handleGesture, { passive: false });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("dblclick", handleDblClick);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("gesturestart", handleGesture);
      window.removeEventListener("gesturechange", handleGesture);
      window.removeEventListener("gestureend", handleGesture);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("dblclick", handleDblClick);

      html.style.overflow = prevStyles.htmlOverflow;
      body.style.overflow = prevStyles.bodyOverflow;
      html.style.overscrollBehavior = prevStyles.htmlOverscroll;
      body.style.overscrollBehavior = prevStyles.bodyOverscroll;
      html.style.touchAction = prevStyles.htmlTouchAction;
      body.style.touchAction = prevStyles.bodyTouchAction;
    };
  }, []);

  /* ================= LOAD MODELS ================= */
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("Starting to load AI models...");
        const MODEL_URL = "/models";
        
        // faceapi in @vladmandic fork handles its own initialization
        // Load face-api models
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        console.log("SSD face model loaded");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log("Tiny face model loaded");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log("Landmarks face model loaded");
        
        setModelsLoaded(true);
        console.log("ALL AI models loaded successfully");
      } catch (err) {
        console.error("CRITICAL Error loading AI models:", err);
        toast.error("AI Proctoring models failed to load. Please refresh the page.", { duration: 10000 });
      }
    };
    loadModels();
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
                if (qRes.data[index].type === "coding") {
                  restored[index] = {
                    code: a.code,
                    language: a.language,
                    isCorrect: a.isCorrect,
                  };
                } else {
                  restored[index] = a.selectedOption;
                }
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

      } catch {
        toast.error("Failed to load exam");
      } finally {
        setLoading(false);
      }
    };

    loadExam();
  }, [examId]);


  /* ================= FORCE MEDIA ALWAYS ON (FAST CHECK) ================= */
  useEffect(() => {
    // Run a fast check every 100ms to instantly revert any mute attempts
    const interval = setInterval(() => {
        // 1. Webcam Stream
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getAudioTracks().forEach(track => {
                if (track.enabled === false) {
                    track.enabled = true;
                    console.log("Force-enabled microphone track (Webcam)");
                }
            });
            mediaStreamRef.current.getVideoTracks().forEach(track => {
                if (track.enabled === false) {
                    track.enabled = true;
                    console.log("Force-enabled video track (Webcam)");
                }
            });
        }

        // 2. Screen Share Stream
        if (screenStreamRef.current) {
            screenStreamRef.current.getAudioTracks().forEach(track => {
                if (track.enabled === false) {
                    track.enabled = true;
                    console.log("Force-enabled audio track (Screen Share)");
                }
            });
        }
    }, 100); 

    return () => clearInterval(interval);
  }, []);

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
        const now = Date.now();
        
        // Only process if the state actually changed from true to false
        // AND we haven't sent a warning in the last 1000ms (to prevent double-firing)
        if (lastFullScreenRef.current && !isFull && (now - lastWarningTimeRef.current > 1000)) {
            lastWarningTimeRef.current = now;
            addLog("fullscreen_exit", "Exited fullscreen");
            setTabSwitches(prev => {
                const newCount = prev + 1;
                const limit = exam.proctoring.tabSwitchLimit || 3;
                if (newCount >= limit) {
                   toast.error("Max violations reached. Submitting...");
                   if (finalSubmitRef.current) {
                     finalSubmitRef.current();
                   }
                } else {
                   toast.error(`Warning: Fullscreen exit detected! (${newCount}/${limit})`);
                }
                return newCount;
            });
        }
        
        setIsFullScreen(isFull);
        lastFullScreenRef.current = isFull;
      };
      document.addEventListener("fullscreenchange", handleFullScreenChange);
      
      // Initialize the ref with current state
      lastFullScreenRef.current = !!document.fullscreenElement;
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
    console.log("Monitoring started. Multi-person detection:", exam.proctoring?.multiplePersonDetection);

    const interval = setInterval(async () => {
      const stream = mediaStreamRef.current;
      const videoEl = videoRef.current;

      let issue = null;
      console.log("Monitoring cycle triggered. Face models loaded:", modelsLoaded);

      // Check 1: Stream integrity
      if (!stream) {
        issue = "Camera disconnected";
      } else {
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        // FORCE UNMUTE / ALWAYS ON LOGIC
        // If the user tries to mute via software controls (enabled=false), we force it back to true.
        if (videoTrack && !videoTrack.enabled) {
             videoTrack.enabled = true;
        }
        if (audioTrack && !audioTrack.enabled) {
             audioTrack.enabled = true;
        }

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
           if (avgBrightness < 15) { 
             issue = "Person not detected or camera is blank. Please adjust the camera properly";
           }
         } catch (e) {
           console.error("Video analysis error:", e);
         }
      }

      // Check 3: Multiple Person Detection
      if (exam.proctoring?.multiplePersonDetection) {
        if (!modelsLoaded) {
          console.log("Face detection: models not loaded yet");
        } else if (!videoEl || videoEl.readyState !== 4) {
          console.log("Face detection: video not ready. ReadyState:", videoEl?.readyState);
        } else {
          try {
             // LOGS FOR DEBUGGING - Check if video is actually ready
             if (videoEl.readyState < 2 || videoEl.videoWidth === 0) {
                console.warn(`Video not ready for detection: readyState=${videoEl.readyState}, width=${videoEl.videoWidth}`);
                return;
             }

             // Aggressive check: Try BOTH SSD and Tiny to be absolutely sure
             let detectionsSSD = [];
             let detectionsTiny = [];
             
             try {
                detectionsSSD = await faceapi.detectAllFaces(videoEl, new faceapi.SsdMobilenetv1Options({ 
                  minConfidence: 0.4 // Adjusted to be more responsive to side profiles
                }));
             } catch (err) {
                console.error("SSD Detection error:", err);
             }

             try {
                detectionsTiny = await faceapi.detectAllFaces(videoEl, new faceapi.TinyFaceDetectorOptions({ 
                  inputSize: 512, 
                  scoreThreshold: 0.4 // Adjusted to be more responsive to side profiles
                }));
             } catch (err) {
                console.error("Tiny Detection error:", err);
             }

             // Take the maximum count from both face detection methods
             const finalCount = Math.max(detectionsSSD.length, detectionsTiny.length);
             setFaceCount(finalCount);
             
             if (finalCount === 0) {
                 // REMOVED DELAY - TRIGGER INSTANTLY AS REQUESTED
                 if (!outOfFrameRef.current) {
                   setIsOutOfFrame(true);
                   outOfFrameRef.current = true;
                   setOutOfFrameViolations(prev => {
                     const newCount = prev + 1;
                     addLog("out_of_frame_violation", `No person detected in camera. Violation ${newCount}`);
                     
                     const limit = 5;
                     if (newCount >= limit) {
                        toast.error("CRITICAL: You are out of camera frame! Submitting exam...", { 
                          duration: 5000,
                          style: { background: '#7f1d1d', color: '#fff' }
                        });
                        if (finalSubmitRef.current) finalSubmitRef.current();
                     } else {
                        toast.error(`WARNING: Please stay inside the camera frame! (${newCount}/${limit})`, {
                          duration: 4000,
                          icon: '📷',
                          style: { background: '#991b1b', color: '#fff', fontWeight: 'bold' }
                        });
                     }
                     return newCount;
                   });
                 }
             } else {
                 // Reset IMMEDIATELY if person is detected
                 setIsOutOfFrame(false);
                 outOfFrameRef.current = false;
                 
                 // HEAD ORIENTATION CHECK (If only one person)
                 if (finalCount === 1) {
                    try {
                        const detectionsWithLandmarks = await faceapi.detectSingleFace(videoEl, new faceapi.TinyFaceDetectorOptions({
                            scoreThreshold: 0.3 // Lower threshold for landmarks to catch side views better
                        })).withFaceLandmarks();
                        
                        if (detectionsWithLandmarks) {
                            const landmarks = detectionsWithLandmarks.landmarks;
                            const nose = landmarks.getNose();
                            const jaw = landmarks.getJawOutline();
                            const leftJaw = jaw[0];
                            const rightJaw = jaw[16];
                            const nosePos = nose[0];
                            
                            const jawWidth = Math.abs(rightJaw.x - leftJaw.x);
                            const noseRelativePos = (nosePos.x - leftJaw.x) / jawWidth;
                            
                            // INSTANT TRIGGER: 0.35 - 0.65 is the "straight" range
                            if (noseRelativePos < 0.38 || noseRelativePos > 0.62) {
                                if (!headTurnRef.current) {
                                    setIsHeadTurned(true);
                                    headTurnRef.current = true;
                                    setHeadTurnViolations(prev => {
                                        const newCount = prev + 1;
                                        addLog("head_turn_violation", `Head turned (pos: ${noseRelativePos.toFixed(2)})`);
                                        
                                        if (newCount >= 5) {
                                            toast.error("CRITICAL: Repeatedly looking away! Submitting...", { duration: 3000 });
                                            if (finalSubmitRef.current) finalSubmitRef.current();
                                        } else {
                                            toast.error(`WARNING: Look straight! (${newCount}/5)`, {
                                                duration: 2000,
                                                icon: '👀',
                                                style: { background: '#991b1b', color: '#fff' }
                                            });
                                        }
                                        return newCount;
                                    });
                                }
                            } else {
                                // Clear warning instantly when looking straight
                                if (headTurnRef.current) {
                                    setIsHeadTurned(false);
                                    headTurnRef.current = false;
                                }
                            }
                        }
                    } catch (err) {
                        console.error("Head orientation check failed:", err);
                    }
                 } else {
                     // Reset if not 1 person
                     if (headTurnRef.current) {
                         setIsHeadTurned(false);
                         headTurnRef.current = false;
                     }
                 }
             }
             
             const now = Date.now();
             if (now - lastFaceLogTimeRef.current >= 5000) {
               console.log(`[AI MONITOR] Total Count: ${finalCount} (Face SSD: ${detectionsSSD.length}, Face Tiny: ${detectionsTiny.length})`);
               lastFaceLogTimeRef.current = now;
             }
             
             if (finalCount > 1) {
                 // REMOVED DELAY - TRIGGER INSTANTLY AS REQUESTED
                 if (!multiPersonRef.current) {
                   setIsMultiplePersons(true);
                   multiPersonRef.current = true;
                   
                   // AGGRESSIVE MULTI-PERSON VIOLATION LOGIC
                   setMultiPersonViolations(prev => {
                     const newCount = prev + 1;
                     addLog("multi_person_violation", `Multiple persons detected (${finalCount} people). Violation ${newCount}`);
                     
                     const limit = 3;
                     if (newCount >= limit) {
                        toast.error("CRITICAL: Multiple persons detected! Submitting exam immediately...", { 
                          duration: 5000,
                          style: { background: '#7f1d1d', color: '#fff' }
                        });
                        if (finalSubmitRef.current) {
                          finalSubmitRef.current();
                        }
                     } else {
                        toast.error(`WARNING: Multiple persons detected! (${newCount}/${limit})`, {
                          duration: 4000,
                          icon: '🚨',
                          style: {
                            background: '#991b1b',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '16px',
                            border: '2px solid white'
                          }
                        });
                     }
                     return newCount;
                   });
                 }
                 return;
             } else {
                 // Reset IMMEDIATELY if count is 1 or 0
                 setIsMultiplePersons(false);
                 multiPersonRef.current = false;
             }
          } catch (e) {
             console.error("CRITICAL Face detection error:", e);
          }
        }
      }

      if (issue) {
         if (!deviceViolationRef.current) {
            console.log("PROCTORING ISSUE DETECTED:", issue);
            deviceViolationRef.current = true;
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
      } else {
         deviceViolationRef.current = false;
      }
    }, 1000); // Check every 1 second for near-instant response

    return () => clearInterval(interval);
  }, [exam, modelsLoaded]);

  // 4. TAB SWITCH
  useEffect(() => {
      if (!exam?.proctoring?.tabSwitch) return;

      const handleVisibilityChange = () => {
        const now = Date.now();
        if (document.hidden && (now - lastWarningTimeRef.current > 1000)) {
          lastWarningTimeRef.current = now;
          setTabSwitches(prev => {
            const newCount = prev + 1;
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
            return newCount;
          });
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [exam]);

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
        answers: Object.entries(answersRef.current).flatMap(([index, data]) => {
          const q = questionsRef.current[index];
          if (!q) return [];
          if (q.type === "coding") {
            return {
              questionId: q._id,
              code: data.code,
              language: data.language,
              isCorrect: data.isCorrect,
              testCases: data.testCases,
            };
          }
          return {
            questionId: q._id,
            selectedOption: data,
          };
        }),
        markedForReview: Array.from(markedRef.current)
          .map((idx) => questionsRef.current[idx]?._id)
          .filter(Boolean),
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
  }, [questions.length, examId]);

  /* ================= HANDLE ACTIONS ================= */
  const handleSelect = (optionIndex) => {
    setAnswers((prev) => {
      const next = { ...prev, [current]: optionIndex };
      answersRef.current = next;
      return next;
    });
  };

  const toggleMark = () => {
    setMarked(prev => {
      const newSet = new Set(prev);
      if (newSet.has(current)) newSet.delete(current);
      else newSet.add(current);
      markedRef.current = newSet;
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
  const finalSubmit = async (type = "manual") => {
    try {
      if (submittingRef.current) return;
      submittingRef.current = true;

      // Ensure type is a string and not an event object
      const submissionType = typeof type === 'string' ? type : "manual";

      if (submissionType === "auto") {
        setIsAutoSubmitting(true);
        toast.loading("Time's up! Auto-submitting your exam...", { id: "auto-submit" });
      }

      await triggerAutoSave();

      // 1. Prioritize Answer Submission (Submit answers first)
      const submissionData = {
        examId,
        submissionType,
        answers: Object.entries(answersRef.current).flatMap(([index, data]) => {
          const q = questionsRef.current[index];
          if (!q) return [];
          if (q.type === "coding") {
            return {
              questionId: q._id,
              code: data.code,
              language: data.language,
              isCorrect: data.isCorrect,
              testCases: data.testCases,
            };
          }
          return {
            questionId: q._id,
            selectedOption: data,
          };
        }),
        markedForReview: Array.from(markedRef.current)
          .map((idx) => questionsRef.current[idx]?._id)
          .filter(Boolean),
        activityLogs: logsRef.current,
      };

      await submitExam(submissionData);

      // 2. Upload Recordings (in background if possible, or wait)
      try {
        await uploadRecordings();
      } catch (recErr) {
        console.error("Recording upload failed", recErr);
        // Don't block exam submission for recording failure
      }

      // 3. Stop Camera/Mic/Screen
      stopMediaStream();
      
      // Exit Fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error(err));
      }

      if (submissionType === "auto") {
        toast.success("Exam auto-submitted successfully", { id: "auto-submit" });
      } else {
        toast.success("Exam submitted successfully");
      }
      
      navigate(`/student/result/${examId}`);
    } catch (error) {
      console.error("Submission error:", error);
      const errorMessage = error.response?.data?.message || "Failed to submit exam";
      
      if (submissionType === "auto") {
        toast.error(`Auto-submit failed: ${errorMessage}. Please click submit manually if possible.`, { id: "auto-submit" });
        setIsAutoSubmitting(false);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      submittingRef.current = false;
    }
  };

  // Keep finalSubmitRef updated
  useEffect(() => {
    finalSubmitRef.current = finalSubmit;
  });

  /* ================= AUTO SUBMIT ON TIME UP ================= */
  const handleTimeUp = () => {
    if (finalSubmitRef.current) finalSubmitRef.current("auto");
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
              video: { 
                  cursor: "always",
                  displaySurface: "monitor",
                  selfBrowserSurface: "exclude",
                  surfaceSwitching: "exclude",
                  monitorTypeSurfaces: "include",
              }, 
              audio: true 
          });

          const screenVideoTrack = screenStream.getVideoTracks()[0];
          const displaySurface = screenVideoTrack?.getSettings?.()?.displaySurface;
          if (displaySurface && displaySurface !== "monitor") {
              screenStream.getTracks().forEach(track => track.stop());
              toast.error("Select only 'Entire screen' to continue.");
              return;
          }

          // Check if system audio track exists
          const systemAudioTrack = screenStream.getAudioTracks()[0];
          
          if (!systemAudioTrack) {
              // Stop the video track if audio wasn't shared
              screenStream.getTracks().forEach(track => track.stop());
              toast.error("Without audio you can't share the screen. Please turn on the 'Also share system audio' option!");
              return;
          }

          let finalStream = screenStream;
          const audioTracks = [];

          // 1. Get System Audio (already confirmed exists)
          audioTracks.push(systemAudioTrack);

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
              if (finalSubmitRef.current) finalSubmitRef.current("auto");
          };
      } catch (err) {
          console.error(err);
          toast.error("Screen sharing is required!");
      }
  };

  const isLastQuestion = questions.length > 0 && current === questions.length - 1;

  return (
    <div className={`h-screen bg-gray-50 flex flex-col touch-manipulation ${isFullScreen ? "fullscreen-mode" : ""}`}>
      {/* Screen Share Required Overlay */}
      {exam?.proctoring?.screenRecording && !hasScreenShare ? (
          <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-[110] text-white">
              <h2 className="text-2xl font-bold mb-4">Screen Share Required</h2>
              <p className="mb-6">This exam requires screen recording. Please select only Entire screen to proceed.</p>
              <button 
                  onClick={enableScreenShare}
                  className="px-6 py-3 bg-blue-600 rounded font-bold hover:bg-blue-700"
              >
                  Enable Screen Share
              </button>
          </div>
      ) : (
          /* Fullscreen Required Overlay - Only show if Screen Share is already done or not required */
          exam?.proctoring?.fullScreen && !isFullScreen && (
              <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center z-[110] text-white">
                  <h2 className="text-2xl font-bold mb-4">Fullscreen Required</h2>
                  <p className="mb-6">You must be in fullscreen mode to take this exam.</p>
                  <button 
                      onClick={enterFullScreen}
                      className="px-6 py-3 bg-blue-600 rounded font-bold hover:bg-blue-700"
                  >
                      Enter Fullscreen
                  </button>
              </div>
          )
      )}
      {/* Header */}
      <header className={`h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-50 shadow-sm flex-shrink-0`}>
        <div className="flex items-center gap-4">
          <h1 className="font-bold text-xl text-gray-800 tracking-tight">Online Examination</h1>
          {exam && (
            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase border border-blue-100">
              {exam.title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          {initialSeconds !== null ? (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:block">Time Remaining</span>
              <Timer
                initialSeconds={initialSeconds}
                onTimeUp={handleTimeUp}
              />
            </div>
          ) : (
            <div className="text-gray-400 text-sm italic">Initializing timer...</div>
          )}
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => {
                  if (isFullScreen) {
                    document.exitFullscreen();
                  } else {
                    document.documentElement.requestFullscreen().catch(console.error);
                  }
                }}
                className="text-gray-600 hover:text-gray-900"
                title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>
        </div>
      </header>

      {/* Auto-Submit Overlay */}
      {isAutoSubmitting && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-[100] backdrop-blur-sm">
          <div className="bg-[#1e1e1e] p-8 rounded-2xl border border-blue-500/30 flex flex-col items-center max-w-sm text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-6"></div>
            <h2 className="text-2xl font-bold text-white mb-2">Time is Up!</h2>
            <p className="text-gray-400 mb-4">Your exam is being automatically submitted. Please do not close this window.</p>
            <div className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-lg text-sm font-medium border border-blue-500/20">
              Saving your answers...
            </div>
          </div>
        </div>
      )}

      {/* Multiple Persons Detected Overlay */}
      {isMultiplePersons && (
        <div className="fixed inset-0 bg-red-900/95 flex flex-col items-center justify-center z-[100] backdrop-blur-md text-white p-6">
          <div className="bg-white/10 p-8 rounded-2xl border border-red-500/50 flex flex-col items-center max-w-md text-center shadow-2xl animate-bounce">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-red-900/50">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">MULTIPLE PERSONS DETECTED</h2>
            <p className="text-red-100 text-lg mb-6 font-medium leading-relaxed">
              Our system has detected more than one person in the camera feed. This is a proctoring violation.
            </p>
            <div className="px-6 py-3 bg-white/20 rounded-xl border border-white/30 text-sm font-bold animate-pulse">
              Please ensure you are alone to continue the exam.
            </div>
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-red-200 text-xs uppercase tracking-[0.2em] font-black opacity-80">Current Violations</span>
              <div className="flex gap-2">
                {[1, 2, 3].map((v) => (
                  <div 
                    key={v}
                    className={`w-12 h-1.5 rounded-full transition-all duration-500 ${
                      multiPersonViolations >= v ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-2xl font-black mt-1">
                {multiPersonViolations} <span className="text-white/50 text-lg">/ 3</span>
              </span>
            </div>
            <p className="mt-8 text-red-200 text-[10px] uppercase tracking-widest font-black opacity-60">
              The exam will automatically submit after the 3rd violation.
            </p>
          </div>
        </div>
      )}

      {/* Out of Frame Overlay */}
      {isOutOfFrame && !isMultiplePersons && (
        <div className="fixed inset-0 bg-red-900/95 flex flex-col items-center justify-center z-[100] backdrop-blur-md text-white p-6">
          <div className="bg-white/10 p-8 rounded-2xl border border-red-500/50 flex flex-col items-center max-w-md text-center shadow-2xl">
            <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-900/50">
              <Camera size={40} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">PERSON NOT DETECTED</h2>
            <p className="text-red-100 text-lg mb-6 font-medium leading-relaxed">
              We cannot see you in the camera. Please stay in front of the camera at all times.
            </p>
            <div className="px-6 py-3 bg-white/20 rounded-xl border border-white/30 text-sm font-bold animate-pulse">
              Return to the center of the frame to continue.
            </div>
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-red-200 text-xs uppercase tracking-[0.2em] font-black opacity-80">Current Violations</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <div 
                    key={v}
                    className={`w-8 h-1.5 rounded-full transition-all duration-500 ${
                      outOfFrameViolations >= v ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-2xl font-black mt-1">
                {outOfFrameViolations} <span className="text-white/50 text-lg">/ 5</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Head Turn Overlay */}
      {isHeadTurned && !isMultiplePersons && !isOutOfFrame && (
        <div className="fixed inset-0 bg-red-900/95 flex flex-col items-center justify-center z-[100] backdrop-blur-md text-white p-6">
          <div className="bg-white/10 p-8 rounded-2xl border border-red-500/50 flex flex-col items-center max-w-md text-center shadow-2xl">
            <div className="w-20 h-20 bg-amber-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-900/50">
              <UserIcon size={40} strokeWidth={3} />
            </div>
            <h2 className="text-3xl font-black mb-4 tracking-tight">LOOK AT THE SCREEN</h2>
            <p className="text-red-100 text-lg mb-6 font-medium leading-relaxed">
              Please look directly at the screen. Turning your head away is a violation.
            </p>
            <div className="px-6 py-3 bg-white/20 rounded-xl border border-white/30 text-sm font-bold animate-pulse">
              Look straight ahead to continue the exam.
            </div>
            <div className="mt-6 flex flex-col items-center gap-2">
              <span className="text-red-200 text-xs uppercase tracking-[0.2em] font-black opacity-80">Current Violations</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((v) => (
                  <div 
                    key={v}
                    className={`w-8 h-1.5 rounded-full transition-all duration-500 ${
                      headTurnViolations >= v ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>
              <span className="text-2xl font-black mt-1">
                {headTurnViolations} <span className="text-white/50 text-lg">/ 5</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 flex overflow-hidden relative min-h-0`}>
        {/* Left Side: Question Area (Scrollable) */}
        <div className={`flex-1 flex flex-col bg-white overflow-hidden min-h-0 ${isFullScreen ? (questions[current]?.type === "coding" ? "w-1/2 border-r border-gray-200" : "w-full") : "w-1/3 border-r border-gray-200"}`}>
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {questions[current] && (
              <div className={`space-y-6 animate-in fade-in slide-in-from-left-4 duration-500 ${isFullScreen && questions[current]?.type !== "coding" ? "max-w-4xl mx-auto pt-8" : ""}`}>
                <div className="flex justify-between items-start">
                  <h2 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-lg shadow-blue-200 shadow-lg">
                      {current + 1}
                    </span>
                    Question
                  </h2>
                  <button
                    onClick={toggleMark}
                    className={`p-2 rounded-lg transition-all ${
                      marked.has(current) 
                        ? 'bg-purple-100 text-purple-600 border border-purple-200' 
                        : 'bg-gray-100 text-gray-400 border border-gray-200 hover:text-yellow-600 hover:bg-yellow-50 hover:border-yellow-200'
                    }`}
                    title={marked.has(current) ? "Unmark for review" : "Mark for review"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={marked.has(current) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
                  </button>
                </div>

                <div className="prose prose-blue max-w-none">
                  {questions[current].type === "coding" ? (
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                      {questions[current].question}
                    </div>
                  ) : (
                    <QuestionCard
                      question={questions[current]}
                      selectedOption={answers[current]}
                      onSelect={handleSelect}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={`p-4 bg-white border-t border-gray-200 ${isFullScreen && questions[current]?.type !== "coding" ? "fixed bottom-0 left-0 right-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]" : ""}`}>
            <div className={`flex flex-col gap-4 ${isFullScreen && questions[current]?.type !== "coding" ? "max-w-7xl mx-auto" : ""}`}>
               
               <div className="flex-1">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span> Question Navigator
                  </h3>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Left: Palette */}
                    <div className="flex-1 min-w-[200px]">
                      <QuestionPalette
                        total={questions.length}
                        answers={answers}
                        current={current}
                        onSelect={setCurrent}
                        marked={marked}
                      />
                    </div>

                    {/* Right: Navigation Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        disabled={current === 0}
                        onClick={() => setCurrent((p) => p - 1)}
                        className="flex items-center gap-2 px-6 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30 disabled:hover:bg-transparent border border-gray-200 text-sm shadow-sm"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                        Previous
                      </button>

                      {!isLastQuestion ? (
                        <button
                          onClick={handleSaveAndNext}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
                        >
                          Save & Next
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowSubmit(true)}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg active:scale-95 text-sm"
                        >
                          Submit Exam
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded-sm border border-green-600"></span> Answered</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-purple-600 rounded-sm border border-purple-700"></span> Marked</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-600 rounded-sm border border-blue-700"></span> Current</div>
                    <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-gray-100 border border-gray-300 rounded-sm"></span> Unvisited</div>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Side: Editor/Content Area */}
        <div className={`flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden min-h-0
          ${isFullScreen && questions[current]?.type === "mcq" ? "hidden" : ""}
          ${isFullScreen && questions[current]?.type === "coding" ? "w-1/2" : ""}`}>
          {questions[current]?.type === "coding" ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <CodingEnvironment
                question={questions[current]}
                initialData={answers[current]}
                onSave={handleSelect}
                layout="split-vertical"
              />
            </div>
          ) : (
            <div className="flex-1 p-6 overflow-y-auto">
              <QuestionCard
                question={questions[current]}
                selectedOption={answers[current]}
                onSelect={handleSelect}
              />
            </div>
          )}
        </div>

        {/* WEBCAM FEED - Overlayed Floating */}
        {exam?.proctoring?.webcam && (
          <div 
            className={`fixed bottom-6 right-6 w-48 h-36 bg-black border-2 border-white shadow-2xl rounded-xl overflow-hidden group transition-all duration-300 hover:w-64 hover:h-48 ${isFullScreen ? "z-[60]" : "z-50"}`}
            style={{ 
              transform: `translate(${cameraPos.x}px, ${cameraPos.y}px)`,
              cursor: isDraggingRef.current ? "grabbing" : "default" 
            }}
          >
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            
            {/* Header / Drag Handle */}
            <div className="absolute top-0 left-0 right-0 p-2 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow-md">Live Feed</span>
                </div>
                
                {/* Drag Button */}
                <div 
                  onMouseDown={handleDragStart}
                  className="bg-black/50 p-1.5 rounded-full backdrop-blur-sm cursor-move hover:bg-blue-600 transition-colors pointer-events-auto shadow-sm border border-white/10"
                  title="Drag to move camera"
                >
                  <Move size={14} className="text-white" />
                </div>
            </div>

            {/* Face Count Badge - ALWAYS VISIBLE */}
            {exam?.proctoring?.multiplePersonDetection && (
              <div className={`absolute bottom-2 left-2 px-2 py-1 rounded-md flex items-center gap-1.5 backdrop-blur-md border shadow-lg transition-all duration-300 ${faceCount > 1 ? 'bg-red-600/90 border-red-400 text-white' : 'bg-black/60 border-white/20 text-white'}`}>
                <div className={`w-2 h-2 rounded-full ${!modelsLoaded ? 'bg-gray-500' : faceCount > 1 ? 'bg-white animate-pulse shadow-[0_0_8px_#ffffff]' : faceCount === 1 ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-yellow-500 animate-bounce shadow-[0_0_8px_#eab308]'}`}></div>
                <span className="font-bold tracking-tight text-[10px]">
                  {!modelsLoaded ? 'AI Loading...' : `${faceCount} ${faceCount === 1 ? 'Person' : 'People'}`}
                </span>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Submit Confirmation Modal */}
      <SubmitModal
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
        attempted={Object.keys(answers).length}
        total={questions.length}
        onConfirm={() => finalSubmit("manual")}
      />
    </div>
  );
};

export default Exam;
