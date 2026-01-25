import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  FilePlus,
  HelpCircle,
  BarChart3,
  ClipboardList,
} from "lucide-react";

const AdminSidebar = () => {
  const baseClass =
    "flex items-center gap-3 p-3 rounded-lg transition-all duration-200";

  const activeClass =
    "bg-blue-600 text-white shadow";

  const inactiveClass =
    "text-gray-300 hover:bg-blue-500 hover:text-white";

  return (
    <div className="h-screen w-64 bg-[#0f172a] text-white fixed">
      <h1 className="text-xl font-bold p-6 border-b border-gray-700">
        Exam Admin
      </h1>

      <nav className="p-4 space-y-2">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/admin/create-exam"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <FilePlus size={20} />
          <span>Create Exam</span>
        </NavLink>

        <NavLink
          to="/admin/add-questions"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <HelpCircle size={20} />
          <span>Add Questions</span>
        </NavLink>

        <NavLink
          to="/admin/manage-exams"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <ClipboardList size={20} />
          <span>Manage Exams</span>
        </NavLink>

        <NavLink
          to="/admin/results"
          className={({ isActive }) =>
            `${baseClass} ${isActive ? activeClass : inactiveClass}`
          }
        >
          <BarChart3 size={20} />
          <span>Results</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default AdminSidebar;
