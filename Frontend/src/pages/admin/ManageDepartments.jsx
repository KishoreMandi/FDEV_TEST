import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Plus, Trash2, Building, RefreshCw, X, Pencil, Sparkles, Search, Edit3, CheckCircle } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data } = await getDepartments();
      setDepartments(data);
    } catch {
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
    } catch {
      toast.error("Failed to delete department");
    }
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <AdminSidebar />

      <div className="flex-1 flex flex-col ml-64">
        <AdminHeader />

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-5xl mx-auto">
            {/* Header Section */}
            <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="relative p-3 bg-slate-900 rounded-2xl shadow-xl">
                      <Building className="w-8 h-8 text-amber-300" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">
                        Manage Departments
                    </h1>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Add, edit or remove departments
                    </p>
                  </div>
                </div>

                <button
                  onClick={openAddModal}
                  className="group relative overflow-hidden px-5 py-3 rounded-xl font-semibold text-white bg-amber-500 hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
                >
                  <span className="relative flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Add Department
                  </span>
                </button>
              </div>
            </div>

            {/* Search and Stats */}
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
              <div className="relative">
                <div className="relative bg-white p-5 rounded-2xl border border-slate-200 shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-slate-900 shadow-lg">
                      <Building className="w-6 h-6 text-amber-300" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-2xl font-bold text-slate-900">{departments.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3">
                <div className="relative h-full">
                  <div className="relative bg-white rounded-2xl border border-slate-200 shadow-lg h-full flex items-center px-4">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <input 
                      type="text"
                      placeholder="Search departments..."
                      className="w-full py-3 bg-transparent outline-none text-gray-700"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Department List */}
            <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
              
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                      <Building className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Existing Departments
                      </h3>
                      <p className="text-xs text-gray-500">{filteredDepartments.length} department(s) found</p>
                    </div>
                  </div>
                  <button 
                    onClick={fetchDepartments} 
                    className="p-2.5 rounded-xl bg-slate-100 text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-all duration-200"
                    title="Refresh List"
                  >
                    <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                </div>

                {filteredDepartments.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
                      <Building className="w-10 h-10 text-amber-300" />
                    </div>
                    <p className="text-slate-700 font-medium">{searchTerm ? "No departments match your search" : "No departments found"}</p>
                    <p className="text-slate-500 text-sm mt-1">Add a department to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                    {filteredDepartments.map((dept, index) => (
                      <div 
                        key={dept._id} 
                        className="relative group/card"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <div className="relative bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                          <div className="flex justify-between items-start mb-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
                              <Building className="w-5 h-5 text-amber-300" />
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                              <CheckCircle className="w-3 h-3" />
                              Active
                            </span>
                          </div>
                          
                          <h4 className="font-bold text-gray-800 text-lg mb-2">{dept.name}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2 flex-1">
                            {dept.description || "No description provided."}
                          </p>
                          
                          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
                            <button
                              onClick={() => openEditModal(dept)}
                              className="px-3 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 hover:shadow-md transition-all duration-200 flex items-center gap-1 text-sm font-medium"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(dept._id)}
                              className="px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md transition-all duration-200 flex items-center gap-1 text-sm font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-md animate-fade-in-up">
            <div className="absolute -inset-1 bg-slate-900 rounded-2xl blur-lg opacity-10" />
            
            <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl shadow-lg bg-slate-900">
                    {isEditing ? <Edit3 className="w-5 h-5 text-amber-300" /> : <Plus className="w-5 h-5 text-amber-300" />}
                  </div>
                  <h3 className="font-bold text-lg text-slate-900">
                    {isEditing ? "Edit Department" : "Add New Department"}
                  </h3>
                </div>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4 text-amber-500" />
                    Department Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Human Resources"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none transition-all duration-300"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="group">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Description (Optional)
                  </label>
                  <textarea
                    placeholder="Short description of this department..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-white/80 focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none transition-all duration-300 resize-none h-24"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300"
                  >
                    {isEditing ? "Update Department" : "Create Department"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDepartments;