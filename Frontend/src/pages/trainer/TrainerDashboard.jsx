import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import StatCard from "../../components/StatCard";
import CsvUploader from "../../components/CsvUploader";
import { getAdminStats, getUsers, approveUser, rejectUser, updateUserStatus } from "../../api/adminApi";
import { useAuth } from "../../context/auth";

const TrainerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
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

  const filteredUsers = allUsers.filter(u => 
    (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (u.department?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  if (!stats) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="ml-64 w-full flex items-center justify-center">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <AdminSidebar />

      <div className="ml-64 w-full min-h-screen bg-gray-100">
        <AdminHeader />

        {/* STAT CARDS */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatCard title="Total Exams" value={stats.totalExams} />
          <StatCard title="Total Students" value={stats.totalStudents} />
          <StatCard title="Total Attempts" value={stats.totalAttempts} />
          <StatCard title="Average Score" value={`${stats.avgScore}%`} />
        </div>

        {/* BULK IMPORT - ADMIN ONLY */}
        {user?.role === "admin" && (
          <div className="px-6">
            <CsvUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        )}

        {/* PENDING APPROVALS - ADMIN ONLY */}
        {user?.role === "admin" && pendingUsers.length > 0 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-3 text-yellow-600">Pending Approvals ({pendingUsers.length})</h3>
            <div className="bg-white rounded-xl shadow overflow-hidden mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-yellow-50 border-b">
                    <th className="p-4 font-medium text-gray-600">Name</th>
                    <th className="p-4 font-medium text-gray-600">Email</th>
                    <th className="p-4 font-medium text-gray-600">Role</th>
                    <th className="p-4 font-medium text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u) => (
                    <tr key={u._id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{u.name}</td>
                      <td className="p-4">{u.email}</td>
                      <td className="p-4 capitalize">{u.role}</td>
                      <td className="p-4 flex gap-2">
                        <button
                          onClick={() => handleApprove(u._id)}
                          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 transition"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(u._id)}
                          className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USER MANAGEMENT - ADMIN ONLY */}
        {user?.role === "admin" && (
          <div className="p-6 pt-0">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">User Management</h3>
              <input 
                type="text" 
                placeholder="Search users..." 
                className="p-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="bg-white rounded-xl shadow overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-4 font-medium text-gray-600">Name</th>
                    <th className="p-4 font-medium text-gray-600">Email</th>
                    <th className="p-4 font-medium text-gray-600">Role</th>
                    <th className="p-4 font-medium text-gray-600">Dept</th>
                    <th className="p-4 font-medium text-gray-600">Status</th>
                    <th className="p-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((u) => (
                      <tr key={u._id} className="border-b hover:bg-gray-50">
                        <td className="p-4">{u.name}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4 capitalize">{u.role}</td>
                        <td className="p-4 capitalize">{u.department || "-"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold
                            ${u.status === 'active' ? 'bg-green-100 text-green-800' : 
                              u.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          {u.status === 'active' && (
                            <button
                              onClick={() => handleStatusChange(u._id, 'suspended')}
                              className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                            >
                              Suspend
                            </button>
                          )}
                          {u.status === 'suspended' && (
                            <button
                              onClick={() => handleStatusChange(u._id, 'active')}
                              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                            >
                              Activate
                            </button>
                          )}
                          {u.status !== 'banned' && (
                            <button
                              onClick={() => handleStatusChange(u._id, 'banned')}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                            >
                              Ban
                            </button>
                          )}
                          {u.status === 'banned' && (
                            <button
                              onClick={() => handleStatusChange(u._id, 'active')}
                              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                            >
                              Unban
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-4 text-center text-gray-500">No users found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RECENT ACTIVITY */}
        <div className="p-6 pt-0">
          <h3 className="text-lg font-semibold mb-3">
            Recent Exams
          </h3>

          <div className="bg-white rounded-xl shadow p-4 space-y-2">
            {stats.recentExams.map((exam) => (
              <div key={exam._id} className="text-gray-700">
                • {exam.title}
                <span className="text-sm text-gray-500 ml-2">
                  ({new Date(exam.createdAt).toLocaleDateString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
