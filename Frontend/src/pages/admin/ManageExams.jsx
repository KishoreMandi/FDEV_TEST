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
    let canceled = false;
    const frameId = requestAnimationFrame(() => {
      if (!canceled) {
        setIsVisible(true);
      }
    });

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
      cancelAnimationFrame(frameId);
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
    <div className="flex bg-slate-100">
      <AdminSidebar />
      <div className="ml-64 flex-1 min-h-screen bg-slate-50">
        <AdminHeader />

        <div className="p-6">
          <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-slate-900 shadow-sm">
                <FileText className="w-8 h-8 text-amber-300" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Manage Exams
                </h2>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  View, edit, and manage all your exams
                </p>
              </div>
            </div>
          </div>

          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-slate-900 text-amber-300">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Exams</p>
                  <p className="text-2xl font-bold text-slate-900">{exams.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-emerald-500 text-white">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Published</p>
                  <p className="text-2xl font-bold text-slate-900">{exams.filter(e => e.isPublished).length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500 text-white">
                  <Edit3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Drafts</p>
                  <p className="text-2xl font-bold text-slate-900">{exams.filter(e => !e.isPublished).length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search exams..." 
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                <button
                  onClick={() => setFilterStatus("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filterStatus === "all" 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("published")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filterStatus === "published" 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Published
                </button>
                <button
                  onClick={() => setFilterStatus("draft")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    filterStatus === "draft" 
                      ? "bg-slate-900 text-white shadow-sm" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Drafts
                </button>
              </div>
            </div>
          </div>

          <div className={`relative transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '300ms' }}>
            <div className="relative bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900">
                    <Eye className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Exam List
                    </h3>
                    <p className="text-xs text-gray-500">{filteredExams.length} exam(s) found</p>
                  </div>
                </div>
              </div>

              {filteredExams.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-900 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-amber-300" />
                  </div>
                  <p className="text-gray-700 font-medium">No exams found</p>
                  <p className="text-gray-400 text-sm mt-1">Create your first exam to get started</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-4 text-left text-sm font-semibold text-slate-700">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Exam Title
                          </div>
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-slate-700">
                          <div className="flex items-center justify-center gap-2">
                            <Timer className="w-4 h-4" />
                            Duration
                          </div>
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-slate-700">
                          <div className="flex items-center justify-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Negative
                          </div>
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-slate-700">
                          <div className="flex items-center justify-center gap-2">
                            <ToggleLeft className="w-4 h-4" />
                            Status
                          </div>
                        </th>
                        <th className="p-4 text-center text-sm font-semibold text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExams.map((exam, index) => (
                        <tr 
                          key={exam._id}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm">
                                <FileText className="w-5 h-5 text-amber-300" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{exam.title}</p>
                                <p className="text-xs text-gray-500">{exam.department || 'All Departments'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-medium">
                              <Clock className="w-3 h-3" />
                              {exam.duration} min
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              exam.negativeMarking > 0 
                                ? "bg-red-50 text-red-700 border border-red-200" 
                                : "bg-gray-50 text-gray-600 border border-gray-200"
                            }`}>
                              {exam.negativeMarking || 0}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                              exam.isPublished 
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                                : "bg-amber-50 text-amber-700 border border-amber-200"
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
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors duration-200"
                              >
                                <span className="flex items-center gap-1">
                                  <Edit3 className="w-4 h-4" />
                                  Edit
                                </span>
                              </button>
                              <button
                                onClick={() => handleDelete(exam._id)}
                                className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors duration-200"
                              >
                                <span className="flex items-center gap-1">
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
