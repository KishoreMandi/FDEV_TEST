import { NavLink } from "react-router-dom";
import { useAuth } from "../context/auth";
import {
  LayoutDashboard,
  FilePlus,
  HelpCircle,
  BarChart3,
  ClipboardList,
  PieChart,
  Building,
} from "lucide-react";

const AdminSidebar = () => {
  useAuth();

  const menuItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/admin/create-exam", icon: FilePlus, label: "Create Exam" },
    { to: "/admin/add-questions", icon: HelpCircle, label: "Add Questions" },
    { to: "/admin/manage-exams", icon: ClipboardList, label: "Manage Exams" },
    { to: "/admin/results", icon: BarChart3, label: "Results" },
    { to: "/admin/reports", icon: PieChart, label: "Reports" },
    { to: "/admin/departments", icon: Building, label: "Departments" },
  ];

  return (
    <div className="h-screen w-64 fixed bg-slate-950 text-slate-100 border-r border-slate-800 flex flex-col">
      <div className="px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
            <span className="text-sm font-semibold tracking-tight">
              EA
            </span>
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-tight">
              ExamAdmin
            </h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-[0.16em]">
              Management Portal
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>


    </div>
  );
};

export default AdminSidebar;
