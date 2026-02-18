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
    <div className="relative group">
      {/* Background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
      
      <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-2xl p-6 border border-purple-100/50 shadow-xl overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-2xl animate-float" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-200/30 to-pink-200/30 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        {/* Header */}
        <div className="relative flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-lg shadow-purple-500/20">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">
              Bulk Import Users
            </h3>
            <p className="text-xs text-gray-500">Upload CSV file to import multiple users at once</p>
          </div>
          <Sparkles className="w-4 h-4 text-purple-400 ml-auto animate-pulse" />
        </div>

        {/* Upload area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
            isDragging
              ? 'border-purple-500 bg-purple-100/50 scale-[1.02]'
              : 'border-purple-200/50 hover:border-purple-400 hover:bg-purple-50/30'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 overflow-hidden rounded-xl">
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

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
                <div className="inline-flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50 mb-4">
                  <FileText className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-green-700">{selectedFile.name}</p>
                    <p className="text-xs text-green-500">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500 ml-2" />
                </div>
              </div>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="w-8 h-8 text-purple-500" />
                </div>
                <p className="text-gray-600 font-medium">
                  <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                </p>
                <p className="text-sm text-gray-400 mt-1">CSV files only (max 5MB)</p>
              </>
            )}
          </div>
        </div>

        {/* File info and upload button */}
        <div className="relative flex items-center justify-between mt-4 pt-4 border-t border-purple-100/50">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>Headers: name, email, role, department, password</span>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className={`relative overflow-hidden px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 transform ${
              !selectedFile || loading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 active:scale-95'
            }`}
          >
            {/* Button shimmer */}
            {selectedFile && !loading && (
              <div className="absolute inset-0 -translate-x-full hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
            
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
