import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Upload, FileText, CheckCircle, AlertCircle, X, Sparkles } from "lucide-react";

const CsvUploader = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
    } else {
      toast.error("Please drop a CSV file");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await axios.post("http://localhost:5000/api/admin/users/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      const { successCount, errors } = response.data;
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} users!`);
      }
      
      if (errors && errors.length > 0) {
        const firstError = errors[0];
        toast.error(`Import Failed: ${firstError.message} (${firstError.email})`);
        console.error("Import errors:", errors);
      } else if (successCount === 0) {
         toast.error("No users were imported. Please check your CSV format.");
      }

      if (onUploadSuccess) onUploadSuccess();
      setSelectedFile(null);
      document.getElementById("csvInput").value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative bg-white rounded-xl p-6 border border-slate-200 shadow-sm overflow-hidden">
        <div className="relative flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-lg bg-slate-900 text-slate-50">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Bulk Import Users
            </h3>
            <p className="text-xs text-slate-500">
              Upload CSV file to import multiple users at once
            </p>
          </div>
          <Sparkles className="w-4 h-4 text-slate-400 ml-auto" />
        </div>

        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors duration-200 ${
            isDragging
              ? "border-slate-500 bg-slate-50"
              : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            id="csvInput"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />

          <div className="relative">
            {selectedFile ? (
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-3 px-4 py-3 bg-emerald-50 rounded-xl border border-emerald-100 mb-4">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <div className="text-left">
                    <p className="font-medium text-emerald-700">{selectedFile.name}</p>
                    <p className="text-xs text-emerald-600">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 ml-2" />
                </div>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 mb-4">
                  <Upload className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-slate-600 font-medium">
                  <span className="text-slate-900">
                    Click to upload
                  </span>
                  <span className="text-slate-500"> or drag and drop</span>
                </p>
                <p className="text-sm text-slate-400 mt-1">CSV files only (max 5MB)</p>
              </>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Headers: name, email, role, department, password</span>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className={`relative overflow-hidden px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 transform ${
              !selectedFile || loading
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-900"
            }`}
          >
            <span className="relative flex items-center gap-2">
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload CSV</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CsvUploader;
