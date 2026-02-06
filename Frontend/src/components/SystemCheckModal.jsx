import { useEffect, useRef, useState } from "react";
import { X, Camera, Mic, AlertCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

const SystemCheckModal = ({ open, onClose, onConfirm }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [checks, setChecks] = useState({
    camera: false,
    mic: false,
    permission: "pending", // pending, granted, denied
  });
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      startSystemCheck();
    } else {
      stopStream();
    }

    return () => stopStream();
  }, [open]);

  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setChecks({ camera: false, mic: false, permission: "pending" });
    setError("");
  };

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
    }
  }, [stream]);

  const startSystemCheck = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setStream(mediaStream);
      // Removed direct videoRef access here as it's handled by useEffect

      // Verify tracks
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
  };

  if (!open) return null;

  const allPassed = checks.camera && checks.mic;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-lg rounded-xl p-6 relative shadow-2xl">
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
               <span className={`w-2 h-2 rounded-full ${checks.camera ? 'bg-green-500' : 'bg-red-500'}`}></span>
               {checks.camera ? "Camera Active" : "Camera Error"}
            </div>
          </div>

          {/* Status List */}
          <div className="grid grid-cols-2 gap-4">
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
