import { useEffect, useState } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from "recharts";
import { Download, FileText, Activity, Users, Award, Clock } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

import AdminSidebar from "../../components/AdminSidebar";
import AdminHeader from "../../components/AdminHeader";
import { getReports } from "../../api/reportApi";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const Reports = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, departments, audit

  useEffect(() => {
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

    // Exam Stats Sheet
    const wsExams = XLSX.utils.json_to_sheet(data.examStats);
    XLSX.utils.book_append_sheet(wb, wsExams, "Exams");

    // Department Stats Sheet
    const wsDepts = XLSX.utils.json_to_sheet(data.departmentStats);
    XLSX.utils.book_append_sheet(wb, wsDepts, "Departments");

    // Audit Logs Sheet
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

    // Exam Table
    doc.text("Exam Performance", 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [["Exam", "Avg Score", "Pass %", "Attempts", "Avg Time (min)"]],
      body: data.examStats.map(e => [
        e.examTitle, e.avgScore, e.passPercentage + "%", e.totalAttempts, e.avgTimeMinutes
      ]),
    });

    // Department Table
    let finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Department Ranking", 14, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Department", "Avg Score", "Attempts"]],
      body: data.departmentStats.map(d => [
        d._id || "N/A", d.avgScore.toFixed(2), d.totalAttempts
      ]),
    });

    // Audit Table
    finalY = doc.lastAutoTable.finalY + 15;
    doc.text("Recent Audit Logs", 14, finalY);
    autoTable(doc, {
      startY: finalY + 5,
      head: [["Type", "Description", "User", "Date"]],
      body: data.auditHistory.map(a => [
        a.type, a.description, a.user, new Date(a.timestamp).toLocaleDateString()
      ]),
    });

    doc.save("Exam_Report.pdf");
    toast.success("PDF report downloaded");
  };

  if (loading) {
    return (
      <div className="flex">
        <AdminSidebar />
        <div className="ml-64 w-full h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminSidebar />
      <div className="ml-64 min-h-screen bg-gray-50">
        <AdminHeader />
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
              <p className="text-gray-500 mt-1">Executives want numbers, not excuses.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={downloadExcel}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <FileText size={18} /> Excel
              </button>
              <button 
                onClick={downloadPDF}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                <Download size={18} /> PDF
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-gray-200 mb-8">
            {["overview", "departments", "audit"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-2 font-medium capitalize ${
                  activeClass(activeTab === tab)
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Top Performing Exam</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {[...data.examStats].sort((a,b) => b.passPercentage - a.passPercentage)[0]?.examTitle || "N/A"}
                      </h3>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Award size={24} />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Avg Pass Rate</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {(data.examStats.reduce((acc, curr) => acc + curr.passPercentage, 0) / (data.examStats.length || 1)).toFixed(1)}%
                      </h3>
                    </div>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                      <Activity size={24} />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-gray-500 text-sm">Avg Time Spent</p>
                      <h3 className="text-2xl font-bold mt-1">
                        {(data.examStats.reduce((acc, curr) => acc + curr.avgTimeMinutes, 0) / (data.examStats.length || 1)).toFixed(1)} min
                      </h3>
                    </div>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <Clock size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6">Exam Performance Analysis</h3>
                <div style={{ width: "100%", height: 320 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={data.examStats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="examTitle" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="passPercentage" name="Pass %" fill="#00C49F" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgScore" name="Avg Score" fill="#0088FE" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === "departments" && (
            <div className="space-y-8">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6">Department Ranking</h3>
                <div style={{ width: "100%", height: 384 }}>
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={data.departmentStats} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="_id" type="category" width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="avgScore" name="Average Score" fill="#8884d8" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                    <tr>
                      <th className="p-4">Rank</th>
                      <th className="p-4">Department</th>
                      <th className="p-4">Average Score</th>
                      <th className="p-4">Total Attempts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.departmentStats.map((dept, index) => (
                      <tr key={dept._id} className="hover:bg-gray-50">
                        <td className="p-4 font-bold text-gray-400">#{index + 1}</td>
                        <td className="p-4 font-medium">{dept._id || "Unassigned"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            dept.avgScore >= 70 ? 'bg-green-100 text-green-700' : 
                            dept.avgScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 
                            'bg-red-100 text-red-700'
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
          )}

          {activeTab === "audit" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold">System Audit History</h3>
                <p className="text-gray-500 text-sm">Recent system events and user activities</p>
              </div>
              <div className="divide-y divide-gray-100">
                {data.auditHistory.map((log, i) => (
                  <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        log.type.includes("Exam") ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                      }`}>
                        {log.type.includes("Exam") ? <FileText size={18} /> : <Users size={18} />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{log.description}</p>
                        <p className="text-xs text-gray-500">{log.user} • {log.type}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {data.auditHistory.length === 0 && (
                  <div className="p-8 text-center text-gray-500">No recent activity found</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const activeClass = (isActive) => 
  isActive 
    ? "text-blue-600 border-b-2 border-blue-600" 
    : "text-gray-500 hover:text-gray-700";

export default Reports;
