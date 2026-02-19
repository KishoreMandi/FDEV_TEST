import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import StatCard from "../../components/StatCard";
import CsvUploader from "../../components/CsvUploader";
import { getAdminStats, getUsers, approveUser, rejectUser, updateUserStatus, deleteUser, updateUserDetails } from "../../api/adminApi";
import { useAuth } from "../../context/auth";
import { 
  FileText, 
  Users, 
  CheckCircle, 
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
  Ban,
  Edit3,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  AlertTriangle,
  Sparkles,
  X,
  User,
  Mail,
  Building,
  Hash
} from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", department: "", employeeId: "" });
  const [activeTab, setActiveTab] = useState("all");
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useAuth();

  const fetchStats = async () => {
    try {
      const res = await getAdminStats();
      setStats(res.data);
    } catch {
      toast.error("Failed to load admin stats");
    }
  };

  const fetchUsers = async () => {
    if (user?.role === "admin") {
      try {
        const res = await getUsers();
        setAllUsers(res.data);
        setPendingUsers(res.data.filter((u) => !u.isApproved));
      } catch {
        console.error("Failed to fetch users");
      }
    }
  };

  useEffect(() => {
    let canceled = false;
    const frameId = requestAnimationFrame(() => {
      if (!canceled) {
        setIsVisible(true);
      }
    });

    (async () => {
      try {
        const res = await getAdminStats();
        if (!canceled) setStats(res.data);
      } catch {
        toast.error("Failed to load admin stats");
      }

      if (user?.role === "admin") {
        try {
          const res = await getUsers();
          if (!canceled) {
            setAllUsers(res.data);
            setPendingUsers(res.data.filter((u) => !u.isApproved));
          }
        } catch {
          console.error("Failed to fetch users");
        }
      }
    })();

    return () => {
      canceled = true;
      cancelAnimationFrame(frameId);
    };
  }, [user?.role]);

  const handleApprove = async (id) => {
    try {
      await approveUser(id);
      toast.success("User approved");
      fetchUsers();
      fetchStats();
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id) => {
    if (window.confirm("Are you sure you want to reject and remove this user?")) {
      try {
        await rejectUser(id);
        toast.success("User rejected and removed");
        fetchUsers();
        fetchStats();
      } catch {
        toast.error("Failed to reject user");
      }
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateUserStatus(id, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleUploadSuccess = () => {
    fetchStats();
    fetchUsers();
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      try {
        await deleteUser(id);
        toast.success("User deleted successfully");
        fetchUsers();
        fetchStats();
      } catch {
        toast.error("Failed to delete user");
      }
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || "",
      employeeId: user.employeeId || ""
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const trimmedForm = {
        ...editForm,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        department: editForm.department.trim(),
        employeeId: editForm.employeeId.trim(),
      };
      await updateUserDetails({ userId: editingUser._id, ...trimmedForm });
      toast.success("User updated successfully");
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update user");
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.role !== 'admin' && (
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.employeeId?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.department?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    )
  );

  if (!stats) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="ml-64 w-full min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-500" />
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-purple-500 animate-pulse" />
            </div>
            <p className="mt-4 text-gray-600 font-medium animate-pulse">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="ml-64 w-full min-h-screen bg-slate-50">
        <AdminHeader />

        <div className="px-6 pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Exams" value={stats.totalExams} icon={FileText} index={0} />
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} index={1} />
          <StatCard title="Total Attempts" value={stats.totalAttempts} icon={CheckCircle} index={2} />
          <StatCard title="Average Score" value={`${stats.avgScore}%`} icon={TrendingUp} index={3} />
        </div>

        {/* BULK IMPORT - ADMIN ONLY */}
        {user?.role === "admin" && (
          <div className="p-6">
            <CsvUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* PENDING APPROVALS - ADMIN ONLY */}
        {user?.role === "admin" && pendingUsers.length > 0 && (
          <div className="p-6">
            <div className="relative">
              <div className="relative bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                      <AlertTriangle className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                        Pending Approvals
                      </h3>
                      <p className="text-xs text-amber-600">{pendingUsers.length} user(s) waiting for approval</p>
                    </div>
                    <span className="ml-auto px-3 py-1 rounded-full bg-amber-500 text-white text-sm font-medium animate-pulse">
                      {pendingUsers.length}
                    </span>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-4 font-semibold text-slate-700 text-sm">Name</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Email</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Role</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Department</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingUsers.map((u, index) => (
                        <tr 
                            key={u._id} 
                            className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-200"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                                  <User className="w-4 h-4 text-amber-300" />
                                </div>
                              <span className="font-medium text-gray-700">{u.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-600">{u.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium capitalize">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4 text-gray-600 capitalize">{u.department || "-"}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApprove(u._id)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all duration-200 flex items-center gap-1"
                              >
                                <UserCheck className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(u._id)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 transition-all duration-200 flex items-center gap-1"
                              >
                                <UserX className="w-4 h-4" />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USER MANAGEMENT - ADMIN ONLY */}
        {user?.role === "admin" && (
          <div className="p-6 pt-0">
            <div className="relative">
              <div className="relative bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden">
                {/* Header with search */}
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                        <Users className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          User Management
                        </h3>
                        <p className="text-xs text-gray-500">Manage and organize all users</p>
                      </div>
                    </div>
                    
                    {/* Search bar */}
                    <div className="relative w-full sm:w-72">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm focus:border-amber-400 focus:ring-2 focus:ring-amber-200/50 focus:outline-none text-sm transition-all duration-300"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="p-4 font-semibold text-slate-700 text-sm">Name</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">ID</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Email</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Role</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Dept</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Status</th>
                        <th className="p-4 font-semibold text-slate-700 text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u, index) => (
                          <tr 
                            key={u._id} 
                            className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-200 group"
                            style={{ animationDelay: `${index * 30}ms` }}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                                  <span className="text-white text-sm font-medium">{u.name?.charAt(0)?.toUpperCase()}</span>
                                </div>
                                <span className="font-medium text-gray-700">{u.name}</span>
                              </div>
                            </td>
                            <td className="p-4 text-gray-500 text-sm">{u.employeeId || "-"}</td>
                            <td className="p-4 text-gray-600">{u.email}</td>
                            <td className="p-4">
                              <span className="px-2 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-medium capitalize">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-gray-600 capitalize">{u.department || "-"}</td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${
                                u.status === 'active' 
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : u.status === 'suspended' 
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                                  : 'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  u.status === 'active' ? 'bg-green-500' : u.status === 'suspended' ? 'bg-amber-500' : 'bg-red-500'
                                }`} />
                                {u.status}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1.5 flex-wrap">
                                {u.status === 'active' && (
                                  <button
                                    onClick={() => handleStatusChange(u._id, 'suspended')}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all duration-200 flex items-center gap-1"
                                    title="Suspend"
                                  >
                                    <Clock className="w-3 h-3" />
                                    <span className="hidden sm:inline">Suspend</span>
                                  </button>
                                )}
                                {u.status === 'suspended' && (
                                  <button
                                    onClick={() => handleStatusChange(u._id, 'active')}
                                    className="px-2.5 py-1.5 rounded-lg bg-green-500 text-white text-xs font-medium hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all duration-200 flex items-center gap-1"
                                    title="Activate"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                    <span className="hidden sm:inline">Activate</span>
                                  </button>
                                )}
                                {u.status !== 'banned' && (
                                  <button
                                    onClick={() => handleStatusChange(u._id, 'banned')}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 transition-all duration-200 flex items-center gap-1"
                                    title="Ban"
                                  >
                                    <Ban className="w-3 h-3" />
                                    <span className="hidden sm:inline">Ban</span>
                                  </button>
                                )}
                                {u.status === 'banned' && (
                                  <button
                                    onClick={() => handleStatusChange(u._id, 'active')}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-medium hover:bg-slate-600 hover:shadow-lg hover:shadow-slate-700/30 hover:scale-105 transition-all duration-200 flex items-center gap-1"
                                    title="Unban"
                                  >
                                    <UserCheck className="w-3 h-3" />
                                    <span className="hidden sm:inline">Unban</span>
                                  </button>
                                )}
                                <button
                                    onClick={() => handleEditClick(u)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-medium hover:bg-slate-600 hover:shadow-lg hover:shadow-slate-700/30 hover:scale-105 transition-all duration-200 flex items-center gap-1"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                <button
                                    onClick={() => handleDeleteUser(u._id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 hover:scale-105 transition-all duration-200 flex items-center gap-1"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span className="hidden sm:inline">Delete</span>
                                  </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="p-8 text-center">
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <Users className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-gray-500 font-medium">No users found</p>
                              <p className="text-gray-400 text-sm">Try adjusting your search terms</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RECENT ACTIVITY */}
        <div className={`relative p-6 pt-0 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '500ms' }}>
          <div className="relative">
            <div className="relative bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                      <Clock className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">
                      Recent Exams
                    </h3>
                    <p className="text-xs text-gray-500">Latest exam activity</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {stats.recentExams.length > 0 ? (
                  stats.recentExams.map((exam, index) => (
                    <div 
                      key={exam._id}
                      className="group/item flex items-center gap-4 p-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-amber-300 transition-all duration-300 cursor-pointer"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg group-hover/item:scale-110 transition-transform duration-300">
                        <FileText className="w-5 h-5 text-amber-300" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-700 group-hover/item:text-amber-600 transition-colors">{exam.title}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(exam.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                        <ChevronDown className="w-4 h-4 text-amber-500 -rotate-90" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No recent exams</p>
                    <p className="text-gray-400 text-sm">Create your first exam to see it here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
          
          {/* Modal */}
          <div className="relative w-full max-w-md animate-fade-in-up">
            <div className="relative group">
              {/* Glow */}
              <div className="absolute -inset-1 bg-slate-900 rounded-2xl blur-lg opacity-10" />
              
              <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900">
                      <Edit3 className="w-5 h-5 text-amber-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Edit User
                    </h3>
                  </div>
                  <button 
                    onClick={() => setEditingUser(null)}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                        <User className="w-4 h-4 text-amber-500" />
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                        <Mail className="w-4 h-4 text-amber-500" />
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none transition-all duration-300"
                        required
                      />
                    </div>

                    {/* Employee ID */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                        <Hash className="w-4 h-4 text-amber-500" />
                        ID
                      </label>
                      <input
                        type="text"
                        name="employeeId"
                        value={editForm.employeeId}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none transition-all duration-300"
                      />
                    </div>

                    {/* Role */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                        <Users className="w-4 h-4 text-amber-500" />
                        Role
                      </label>
                      <select
                        name="role"
                        value={editForm.role}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none transition-all duration-300"
                      >
                        <option value="student">Student</option>
                      </select>
                    </div>

                    {/* Department */}
                    <div className="group">
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                        <Building className="w-4 h-4 text-amber-500" />
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={editForm.department}
                        onChange={handleEditChange}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200/50 focus:outline-none transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-amber-500 text-white font-medium hover:shadow-lg hover:shadow-amber-500/30 hover:scale-105 transition-all duration-200"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
