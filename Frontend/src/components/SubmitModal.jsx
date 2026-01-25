import { X } from "lucide-react";

const SubmitModal = ({
  open,
  onClose,
  onConfirm,
  attempted,
  total,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-md rounded-lg p-6 relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500"
        >
          <X />
        </button>

        <h2 className="text-xl font-bold mb-4">
          Submit Exam?
        </h2>

        <p className="text-gray-700 mb-4">
          Please review before submitting:
        </p>

        <div className="bg-gray-100 rounded p-4 text-sm mb-4">
          <p>✅ Attempted: <b>{attempted}</b></p>
          <p>⚠️ Unattempted: <b>{total - attempted}</b></p>
          <p className="text-red-600 mt-2">
            You cannot reattempt after submission.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Yes, Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitModal;
