import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import StatCard from "../../components/StatCard";
import { getAdminStats } from "../../api/adminApi";


const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getAdminStats();
        setStats(res.data);
      } catch {
        toast.error("Failed to load admin stats");
      }
    };

    fetchStats();
  }, []);

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

        {/* RECENT ACTIVITY */}
        <div className="p-6">
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

export default Dashboard;
