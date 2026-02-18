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
  Sparkles,
  ChevronRight
} from "lucide-react";

const AdminSidebar = () => {
  useAuth();
  
  const menuItems = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard", color: "pink" },
    { to: "/admin/create-exam", icon: FilePlus, label: "Create Exam", color: "purple" },
    { to: "/admin/add-questions", icon: HelpCircle, label: "Add Questions", color: "blue" },
    { to: "/admin/manage-exams", icon: ClipboardList, label: "Manage Exams", color: "pink" },
    { to: "/admin/results", icon: BarChart3, label: "Results", color: "purple" },
    { to: "/admin/reports", icon: PieChart, label: "Reports", color: "blue" },
    { to: "/admin/departments", icon: Building, label: "Departments", color: "pink" },
  ];

  const colorMap = {
    pink: {
      active: "from-pink-500 via-pink-600 to-purple-600",
      hover: "hover:bg-pink-500/10 hover:text-pink-300",
      icon: "text-pink-400",
      border: "border-pink-500",
      glow: "shadow-pink-500/20"
    },
    purple: {
      active: "from-purple-500 via-purple-600 to-blue-600",
      hover: "hover:bg-purple-500/10 hover:text-purple-300",
      icon: "text-purple-400",
      border: "border-purple-500",
      glow: "shadow-purple-500/20"
    },
    blue: {
      active: "from-blue-500 via-blue-600 to-purple-600",
      hover: "hover:bg-blue-500/10 hover:text-blue-300",
      icon: "text-blue-400",
      border: "border-blue-500",
      glow: "shadow-blue-500/20"
    }
  };

  return (
    <div className="h-screen w-64 fixed overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#1e1b4b] to-[#312e81] animate-gradient-shift bg-[length:100%_300%]" />
      
      {/* Animated mesh overlay */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-pink-500 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-gradient-to-bl from-purple-500 to-transparent rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/3 left-0 w-56 h-56 bg-gradient-to-tr from-blue-500 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-pink-500 to-transparent rounded-full blur-2xl animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/20" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Logo section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-blue-500 rounded-xl blur-lg opacity-50 group-hover:opacity-80 transition-opacity duration-300" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Exam
                <span className="bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">Admin</span>
              </h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const colors = colorMap[item.color];
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${colors.active} text-white shadow-lg ${colors.glow} scale-[1.02]`
                      : `text-gray-400 ${colors.hover}`
                  }`
                }
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Active indicator */}
                <div className="absolute left-0 w-1 h-0 bg-white rounded-r transition-all duration-300 group-hover:h-1/2 [.group&]:h-full" />
                
                {/* Icon with glow effect */}
                <div className={`relative p-2 rounded-lg transition-all duration-300 ${
                  false ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
                }`}>
                  <Icon className="w-5 h-5" />
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Label */}
                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                
                {/* Arrow indicator */}
                <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                
                {/* Hover glow effect */}
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl bg-gradient-to-r from-pink-500/20 to-blue-500/20" />
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="p-4 border-t border-white/10">
          <div className="relative p-4 rounded-xl bg-gradient-to-br from-white/5 to-white/10 border border-white/10 overflow-hidden group cursor-pointer">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">System Status</span>
              </div>
              <p className="text-sm font-medium text-white">All Systems Online</p>
              <p className="text-xs text-gray-500 mt-1">Last sync: Just now</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;