import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getExams, deleteExam } from "../../api/examApi";
import { 
  FileText, 
  Clock, 
  AlertCircle, 
  Edit3, 
  Trash2, 
  Sparkles,
  Search,
  CheckCircle,
  Eye,
  Timer,
  ToggleLeft
} from "lucide-react";

const ManageExams = () => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");

  async function loadExams() {
    const res = await getExams();
    setExams(res.data);
  }

  useEffect(() => {
    setIsVisible(true);
    let canceled = false;

    (async () => {
      try {
        const res = await getExams();
        if (!canceled) setExams(res.data);
      } catch {
        toast.error("Failed to load exams");
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  const handleDelete = async (id) => {
    if (!confirm("Delete this exam?")) return;

    try {
      await deleteExam(id);
      toast.success("Exam deleted");
      loadExams();
    } catch {
      toast.error("Delete failed");
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === "all" || 
      (filterStatus === "published" && exam.isPublished) ||
      (filterStatus === "draft" && !exam.isPublished);
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex">
      <AdminSidebar />
      <div className="ml-64 w-full min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-pink-50/30 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-blue-200/30 to-pink-200/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-bl from-purple-200/20 to-blue-200/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        </div>

        <AdminHeader />

        <div className="relative p-6">
          {/* Header Section */}
          <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <div className="flex items-center gap-4 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-50" />
                <div className="relative p-3 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-2xl shadow-xl">
                  <FileText className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Manage Exams
                  </span>
                </h2>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  View, edit, and manage all your exams
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-white to-pink-50/50 p-5 rounded-2xl border border-pink-100 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 shadow-lg">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Exams</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">{exams.length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-white to-green-50/50 p-5 rounded-2xl border border-green-100 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Published</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{exams.filter(e => e.isPublished).length}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-white to-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
                    <Edit3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Drafts</p>
                    <p className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{exams.filter(e => !e.isPublished).length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className={`mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search exams..." 
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-purple-200/50 bg-white/80 backdrop-blur-sm focus:border-purple-400 focus:ring-2 focus:ring-purple-200/50 focus:outline-none transition-all duration-300"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 p-1 bg-gradient-to-r from-gray-100 to-purple-100 rounded-xl">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    filterStatus === "all" 
                      ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("published")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    filterStatus === "published" 
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Published
                </button>
                <button
                  onClick={() => setFilterStatus("draft")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    filterStatus === "draft" 
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Drafts
                </button>
              </div>
            </div>
          </div>

          {/* Exams Table */}
          <div className={`relative group transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
            <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl blur-lg opacity-15 group-hover:opacity-25 transition-opacity duration-500" />
            
            <div className="relative bg-gradient-to-br from-white via-purple-50/30 to-pink-50/30 rounded-2xl shadow-xl border border-purple-100/50 overflow-hidden">
              <div className="p-5 border-b border-purple-100 bg-gradient-to-r from-white to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-lg">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                      Exam List
                    </h3>
                    <p className="text-xs text-gray-500">{filteredExams.length} exam(s) found</p>
                  </div>
                </div>
              </div>

              {filteredExams.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No exams found</p>
                  <p className="text-gray-400 text-sm mt-1">Create your first exam to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gradient-to-r from-purple-50/80 to-pink-50/80">
                        <th className="p-4 text-left text-sm font-semibold text-purple-700">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Exam Title
                          </div>
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-purple-700">
                          <div className="flex items-center justify-center gap-2">
                            <Timer className="w-4 h-4" />
                            Duration
                          </div>
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-purple-700">
                          <div className="flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Negative
                          </div>
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-purple-700">
                          <div className="flex items-center justify-center gap-2">
                            <ToggleLeft className="w-4 h-4" />
                            Status
                          </div>
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-purple-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.map((exam, index) => (
                        <tr 
                          key={exam._id}
                          className="border-b border-purple-100/50 hover:bg-gradient-to-r hover:from-pink-50/30 hover:to-purple-50/30 transition-all duration-200"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center shadow-lg">
                                <FileText className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800">{exam.title}</p>
                                <p className="text-xs text-gray-500">{exam.department || 'All Departments'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-sm font-medium">
                              <Clock className="w-3 h-3" />
                              {exam.duration} min
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              exam.negativeMarking > 0 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {exam.negativeMarking || 0}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              exam.isPublished 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' 
                                : 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200'
                            }`}>
                              {exam.isPublished ? (
                                <>
                                  <CheckCircle className="w-3 h-3" />
                                  Published
                                </>
                              ) : (
                                <>
                                  <Edit3 className="w-3 h-3" />
                                  Draft
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => navigate(`/admin/edit-exam/${exam._id}`)}
                                className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300"
                              >
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <span className="relative flex items-center gap-1">
                                  <Edit3 className="w-4 h-4" />
                                  Edit
                                </span>
                              </button>
                              <button
                                onClick={() => handleDelete(exam._id)}
                                className="group relative overflow-hidden px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
                              >
                                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                                <span className="relative flex items-center gap-1">
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageExams;