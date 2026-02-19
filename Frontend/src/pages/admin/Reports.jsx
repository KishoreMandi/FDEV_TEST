import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { Download, FileText, Activity, Users, Award, Clock, PieChartIcon, BarChart3, Sparkles, TrendingUp, Shield } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getReports } from "../../api/reportApi";

const COLORS = ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await getReports();
      const normalizedDeptStats = res.data.departmentStats.map(d => ({
        ...d,
        _id: d._id || "Unassigned"
      }));
      setData({ ...res.data, departmentStats: normalizedDeptStats });
    } catch (error) {
      toast.error("Failed to load reports");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();
    const wsExams = XLSX.utils.json_to_sheet(data.examStats);
    XLSX.utils.book_append_sheet(wb, wsExams, "Exams");

    const wsDepts = XLSX.utils.json_to_sheet(data.departmentStats);
    XLSX.utils.book_append_sheet(wb, wsDepts, "Departments");

    const wsAudit = XLSX.utils.json_to_sheet(data.auditHistory);
    XLSX.utils.book_append_sheet(wb, wsAudit, "Audit Log");

    XLSX.writeFile(wb, "Exam_Reports.xlsx");
    toast.success("Excel report downloaded");
  };

  const downloadPDF = () => {
    if (!data) return;

    const doc = new jsPDF();
    doc.text("Exam Performance Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

    doc.text("Exam Performance", 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [["Exam", "Avg Score", "Pass %", "Attempts", "Avg Time (min)"]],
      body: data.examStats.map(e => [
        e.examTitle, e.avgScore, e.passPercentage + "%", e.totalAttempts, e.avgTimeMinutes
      ]),
      headStyles: { fillColor: [236, 72, 153] },
    });

    let finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Department Ranking", 14, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Department", "Avg Score", "Attempts"]],
      body: data.departmentStats.map(d => [
        d._id || "N/A", d.avgScore.toFixed(2), d.totalAttempts
      ]),
      headStyles: { fillColor: [139, 92, 246] },
    });

    finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Recent Audit Logs", 14, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Type", "Description", "User", "Date"]],
      body: data.auditHistory.map(a => [
        a.type, a.description, a.user, new Date(a.timestamp).toLocaleDateString()
      ]),
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save("Exam_Report.pdf");
    toast.success("PDF report downloaded");
  };

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="ml-64 w-full h-screen bg-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 border-4 border-slate-200 rounded-full animate-spin border-t-amber-500" />
              <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-amber-500 animate-pulse" />
            </div>
            <p className="mt-4 text-gray-600 font-medium animate-pulse">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminSidebar />
      <div className="ml-64 min-h-screen bg-slate-100 relative overflow-hidden">
        <AdminHeader />
        
        <div className="relative p-8">
          {/* Header */}
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="relative p-3 bg-slate-900 rounded-2xl shadow-xl">
                  <PieChartIcon className="w-8 h-8 text-amber-300" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                    Reports & Analytics
                </h1>
                <p className="text-gray-500 flex items-center gap-2 mt-1">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Comprehensive exam performance insights
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={downloadExcel}
                className="group relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-green-500 hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <FileText className="w-4 h-4 relative" />
                <span className="relative">Excel</span>
              </button>
              <button 
                onClick={downloadPDF}
                className="group relative overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-red-500 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300"
              >
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <Download className="w-4 h-4 relative" />
                <span className="relative">PDF</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className={`mb-8 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
            <div className="flex gap-2 p-1 bg-slate-200 rounded-xl w-fit">
              {[
                { key: "overview", label: "Overview", icon: BarChart3 },
                { key: "departments", label: "Departments", icon: PieChartIcon },
                { key: "audit", label: "Audit Log", icon: Shield }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 ${
                      activeTab === tab.key 
                        ? "bg-slate-900 text-amber-300 shadow-lg" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700`} style={{ transitionDelay: '200ms' }}>
                <div className="relative">
                  <div className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Top Performing Exam</p>
                        <h3 className="text-xl font-bold mt-2 text-slate-900">
                          {[...data.examStats].sort((a,b) => b.passPercentage - a.passPercentage)[0]?.examTitle || "N/A"}
                        </h3>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 shadow-lg">
                        <Award className="w-6 h-6 text-amber-300" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Avg Pass Rate</p>
                        <h3 className="text-2xl font-bold mt-2 text-green-600">
                          {(data.examStats.reduce((acc, curr) => acc + curr.passPercentage, 0) / (data.examStats.length || 1)).toFixed(1)}%
                        </h3>
                      </div>
                      <div className="p-3 rounded-xl bg-green-500 shadow-lg">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <div className="relative bg-white p-6 rounded-2xl border border-slate-200 shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-gray-500 text-sm">Avg Time Spent</p>
                        <h3 className="text-2xl font-bold mt-2 text-slate-900">
                          {(data.examStats.reduce((acc, curr) => acc + curr.avgTimeMinutes, 0) / (data.examStats.length || 1)).toFixed(1)} min
                        </h3>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 shadow-lg">
                        <Clock className="w-6 h-6 text-amber-300" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className={`relative transition-all duration-700`} style={{ transitionDelay: '300ms' }}>
                <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                      <BarChart3 className="w-5 h-5 text-amber-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Exam Performance Analysis
                    </h3>
                  </div>
                  <div style={{ width: "100%", height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={data.examStats}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="examTitle" tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.95)', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="passPercentage" name="Pass %" fill="#10b981" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="avgScore" name="Avg Score" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "departments" && (
            <div className="space-y-8">
              <div className={`relative transition-all duration-700`} style={{ transitionDelay: '200ms' }}>
                <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                      <PieChartIcon className="w-5 h-5 text-amber-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Department Ranking
                    </h3>
                  </div>
                  <div style={{ width: "100%", height: 384 }}>
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={data.departmentStats} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke="#e2e8f0" />
                        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis dataKey="_id" type="category" width={100} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255,255,255,0.95)', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 40px rgba(0,0,0,0.1)' 
                          }} 
                        />
                        <Legend />
                        <Bar dataKey="avgScore" name="Average Score" fill="#f59e0b" radius={[0, 6, 6, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className={`relative transition-all duration-700`} style={{ transitionDelay: '300ms' }}>
                <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-200 bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                        <TrendingUp className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Department Performance Table
                        </h3>
                        <p className="text-xs text-gray-500">{data.departmentStats.length} departments</p>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-4 font-semibold text-slate-700 text-sm">Rank</th>
                          <th className="p-4 font-semibold text-slate-700 text-sm">Department</th>
                          <th className="p-4 font-semibold text-slate-700 text-sm">Average Score</th>
                          <th className="p-4 font-semibold text-slate-700 text-sm">Total Attempts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.departmentStats.map((dept, index) => (
                          <tr 
                            key={dept._id} 
          className="border-b border-slate-100 hover:bg-slate-50 transition-all duration-200"
        >
          <td className="p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
              index === 0 ? 'bg-slate-900 text-amber-300 shadow-lg' :
              index === 1 ? 'bg-slate-900 text-amber-300' :
              index === 2 ? 'bg-slate-900 text-amber-300' :
              'bg-slate-100 text-slate-500'
            }`}>
              #{index + 1}
            </div>
          </td>
          <td className="p-4 font-medium text-gray-800">{dept._id || "Unassigned"}</td>
          <td className="p-4">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              dept.avgScore >= 70 ? 'bg-green-50 text-green-700 border border-green-200' : 
              dept.avgScore >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {dept.avgScore.toFixed(2)}
            </span>
          </td>
          <td className="p-4 text-gray-500">{dept.totalAttempts}</td>
        </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className={`relative transition-all duration-700`} style={{ transitionDelay: '200ms' }}>
              <div className="relative bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-900 shadow-lg">
                      <Shield className="w-5 h-5 text-amber-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        System Audit History
                      </h3>
                      <p className="text-xs text-gray-500">Recent system events and user activities</p>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {data.auditHistory.map((log, i) => (
                    <div 
                      key={i} 
                      className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-slate-900 shadow-lg`}>
                          {log.type.includes("Exam") ? <FileText className="w-5 h-5 text-amber-300" /> : <Users className="w-5 h-5 text-amber-300" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{log.description}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{log.user} • {log.type}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-400 bg-slate-100 px-3 py-1 rounded-full">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                  {data.auditHistory.length === 0 && (
                    <div className="p-12 text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Shield className="w-10 h-10 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No recent activity found</p>
                      <p className="text-gray-400 text-sm mt-1">System events will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;