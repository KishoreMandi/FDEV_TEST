import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const CsvUploader = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
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
      const token = localStorage.getItem("token"); // Assumes token is stored in localStorage
      
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
        // Show the first error message to the user
        const firstError = errors[0];
        toast.error(`Import Failed: ${firstError.message} (${firstError.email})`);
        
        // Also log all to console
        console.error("Import errors:", errors);
      } else if (successCount === 0) {
         toast.error("No users were imported. Please check your CSV format.");
      }

      if (onUploadSuccess) onUploadSuccess();
      setSelectedFile(null);
      // Reset file input
      document.getElementById("csvInput").value = "";
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Error uploading file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow mb-6">
      <h3 className="text-lg font-semibold mb-4">Bulk Import Users</h3>
      <div className="flex items-center gap-4">
        <input
          id="csvInput"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || loading}
          className={`px-4 py-2 rounded-lg text-white font-medium transition
            ${!selectedFile || loading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"}`}
        >
          {loading ? "Uploading..." : "Upload CSV"}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        Upload a CSV with headers: name, email, role, department, password (optional)
      </p>
    </div>
  );
};

export default CsvUploader;
