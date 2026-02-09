import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Building, RefreshCw, X, Pencil } from "lucide-react";
import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getDepartments, addDepartment, deleteDepartment, updateDepartment } from "../../api/departmentApi";

const ManageDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data } = await getDepartments();
      setDepartments(data);
    } catch (error) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormData({ name: "", description: "" });
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setIsEditing(true);
    setCurrentId(dept._id);
    setFormData({ name: dept.name, description: dept.description || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await updateDepartment(currentId, formData);
        toast.success("Department updated successfully");
      } else {
        await addDepartment(formData);
        toast.success("Department added successfully");
      }
      setShowModal(false);
      setFormData({ name: "", description: "" });
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartment(id);
      toast.success("Department deleted");
      fetchDepartments();
    } catch (error) {
      toast.error("Failed to delete department");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            
            {/* Header Section */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Building className="text-blue-600" />
                  Manage Departments
                </h1>
                <p className="text-gray-500 mt-1">Add, edit or remove departments for user registration</p>
              </div>
              
              <button
                onClick={openAddModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition shadow-md"
              >
                <Plus size={20} />
                Add Department
              </button>
            </div>

            {/* Department List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-700">Existing Departments ({departments.length})</h3>
                <button 
                  onClick={fetchDepartments} 
                  className="text-gray-500 hover:text-blue-600 transition p-2 rounded-full hover:bg-blue-50"
                  title="Refresh List"
                >
                  <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                </button>
              </div>

              {departments.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <Building size={48} className="mx-auto text-gray-300 mb-4" />
                  <p>No departments found. Add one to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                  {departments.map((dept) => (
                    <div 
                      key={dept._id} 
                      className="group flex flex-col justify-between bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-all hover:border-blue-200"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-bold text-gray-800 text-lg">{dept.name}</h4>
                           <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium capitalize">
                             {dept.status}
                           </span>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {dept.description || "No description provided."}
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(dept)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition flex items-center gap-1 text-sm font-medium"
                        >
                          <Pencil size={16} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(dept._id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition flex items-center gap-1 text-sm font-medium"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">{isEditing ? "Edit Department" : "Add New Department"}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Human Resources"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <textarea
                  placeholder="Short description of this department..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition resize-none h-24"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition shadow-sm"
                >
                  {isEditing ? "Update Department" : "Create Department"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default ManageDepartments;
