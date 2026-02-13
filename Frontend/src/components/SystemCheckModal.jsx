import { useEffect, useRef, useState } from "react";
import { X, Camera, Mic, AlertCircle, CheckCircle, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import * as faceapi from '@vladmandic/face-api';

const SystemCheckModal = ({ open, onClose, onConfirm }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [checks, setChecks] = useState({
    camera: false,
    mic: false,
    personDetected: false,
    permission: "pending", // pending, granted, denied
  });
  const [error, setError] = useState("");
  const [videoSignalMsg, setVideoSignalMsg] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log("SystemCheck: Loading AI models...");
        const MODEL_URL = "/models";
        
        // faceapi in @vladmandic fork handles its own initialization
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        console.log("SystemCheck: SSD face model loaded");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        console.log("SystemCheck: Tiny face model loaded");
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        console.log("SystemCheck: Landmarks face model loaded");
        
        setModelsLoaded(true);
        console.log("SystemCheck: ALL AI models loaded successfully");
      } catch (err) {
        console.error("SystemCheck: Error loading AI models:", err);
        setError("AI Proctoring models failed to load. Please check your internet or refresh.");
      }
    };
    loadModels();
  }, []);

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setChecks({ camera: false, mic: false, personDetected: false, permission: "pending" });
    setError("");
    setVideoSignalMsg("");
  }

  async function startSystemCheck() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream);

      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];

      if (videoTrack && videoTrack.readyState === "live") {
        setChecks((prev) => ({ ...prev, camera: true }));
      }
      if (audioTrack && audioTrack.readyState === "live") {
        setChecks((prev) => ({ ...prev, mic: true }));
      }

      setChecks((prev) => ({ ...prev, permission: "granted" }));
    } catch (err) {
      console.error("System check failed", err);
      setChecks((prev) => ({ ...prev, permission: "denied" }));
      setError(
        "Could not access Camera or Microphone. Please allow permissions to proceed."
      );
      toast.error("System check failed!");
    }
  }

  useEffect(() => {
    let timeoutId;
    if (open) {
      timeoutId = setTimeout(() => {
        startSystemCheck();
      }, 0);
    } else {
      timeoutId = setTimeout(() => {
        stopStream();
      }, 0);
    }

    return () => {
      clearTimeout(timeoutId);
      stopStream();
    };
  }, [open]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
    }
  }, [stream]);

  // Video Signal & Person Detection Logic
  useEffect(() => {
    let interval;
    if (stream && videoRef.current) {
      interval = setInterval(async () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video.readyState === 4 && canvas) {
          try {
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            canvas.width = 100;
            canvas.height = 100;
            ctx.drawImage(video, 0, 0, 100, 100);
            const imageData = ctx.getImageData(0, 0, 100, 100).data;
            
            let totalBrightness = 0;
            for (let i = 0; i < imageData.length; i += 4) {
              totalBrightness += (imageData[i] + imageData[i + 1] + imageData[i + 2]) / 3;
            }
            const avgBrightness = totalBrightness / (imageData.length / 4);
            
            if (avgBrightness < 15) {
              setChecks(prev => ({ ...prev, personDetected: false }));
              setVideoSignalMsg("Camera is too dark or covered. Please adjust lighting.");
            } else if (modelsLoaded) {
              let faceDetections = [];
              try {
                faceDetections = await faceapi.detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.15 }));
              } catch (e) {
                faceDetections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.15 }));
              }
              
              const totalCount = faceDetections.length;
              
              if (totalCount === 0) {
                setChecks(prev => ({ ...prev, personDetected: false }));
                setVideoSignalMsg("No person detected. Please face the camera.");
              } else if (totalCount > 1) {
                setChecks(prev => ({ ...prev, personDetected: false }));
                setVideoSignalMsg("Multiple persons detected. Please ensure you are alone.");
              } else {
                setChecks(prev => ({ ...prev, personDetected: true }));
                setVideoSignalMsg("");
              }
            } else {
              // Models not loaded yet, fallback to brightness
              setChecks(prev => ({ ...prev, personDetected: true }));
              setVideoSignalMsg("");
            }
          } catch (err) {
            console.error("Video analysis error:", err);
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [stream, modelsLoaded]);

  if (!open) return null;

  const allPassed = checks.camera && checks.mic && checks.personDetected;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-lg rounded-xl p-6 relative shadow-2xl">
        <canvas ref={canvasRef} className="hidden" />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-800">System Verification</h2>

        <div className="space-y-6">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Camera size={48} className="mb-2" />
                <p>Camera is off</p>
              </div>
            )}
            
            {/* Status Overlay */}
            <div className="absolute top-2 left-2 bg-black/60 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2">
               <span className={`w-2 h-2 rounded-full ${checks.camera && checks.personDetected ? 'bg-green-500' : 'bg-red-500'}`}></span>
               {checks.camera && checks.personDetected ? "Camera Active" : "Camera Issue"}
            </div>
          </div>

          {/* Status List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div className={`p-4 rounded-lg border flex items-center gap-3 ${checks.camera ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <Camera className={checks.camera ? "text-green-600" : "text-red-500"} />
                <div>
                   <p className="font-semibold text-sm">Camera</p>
                   <p className="text-xs text-gray-500">{checks.camera ? "Detected & Working" : "Not Detected"}</p>
                </div>
                {checks.camera ? <CheckCircle size={18} className="text-green-600 ml-auto" /> : <AlertCircle size={18} className="text-red-500 ml-auto" />}
             </div>

             <div className={`p-4 rounded-lg border flex items-center gap-3 ${checks.mic ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <Mic className={checks.mic ? "text-green-600" : "text-red-500"} />
                <div>
                   <p className="font-semibold text-sm">Microphone</p>
                   <p className="text-xs text-gray-500">{checks.mic ? "Detected & Working" : "Not Detected"}</p>
                </div>
                {checks.mic ? <CheckCircle size={18} className="text-green-600 ml-auto" /> : <AlertCircle size={18} className="text-red-500 ml-auto" />}
             </div>

             <div className={`p-4 rounded-lg border flex items-center gap-3 col-span-1 sm:col-span-2 ${checks.personDetected ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                <UserIcon className={checks.personDetected ? "text-green-600" : "text-amber-500"} />
                <div>
                   <p className="font-semibold text-sm">Person Detection</p>
                   <p className="text-xs text-gray-500">{checks.personDetected ? "Person Detected" : (videoSignalMsg || "Adjusting...")}</p>
                </div>
                {checks.personDetected ? <CheckCircle size={18} className="text-green-600 ml-auto" /> : <AlertCircle size={18} className="text-amber-500 ml-auto" />}
             </div>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
              <button 
                onClick={() => { setError(""); startSystemCheck(); }}
                className="ml-auto text-xs bg-white px-2 py-1 rounded border border-red-200 hover:bg-gray-50"
              >
                Retry
              </button>
            </div>
          )}

          {!allPassed && !error && (
             <button 
               onClick={startSystemCheck}
               className="w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700"
             >
               Refresh Camera / Retry Check
             </button>
          )}

          <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded">
             <p><b>Note:</b> You must keep your camera and microphone ON during the entire exam. Turning them off will result in automatic submission.</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!allPassed}
            className={`px-5 py-2.5 rounded-lg text-white font-medium transition flex items-center gap-2 ${
              allPassed
                ? "bg-blue-600 hover:bg-blue-700 shadow-lg"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemCheckModal;
