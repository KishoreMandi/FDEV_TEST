import { useAuth } from "../context/auth";
import { Bell, User, LogOut } from "lucide-react";
import { useState } from "react";

const AdminHeader = () => {
  const { user, logout } = useAuth();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-purple-50 to-pink-50 animate-gradient-shift bg-[length:200%_200%]" />
      
      {/* Floating orbs */}
      <div className="absolute top-0 right-1/4 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-0 left-1/4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-pink-400/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Main content */}
      <div className="relative flex justify-between items-center px-6 py-4 border-b border-gradient-to-r from-pink-200/50 via-purple-200/50 to-blue-200/50">
        <div className="flex items-center gap-4">
          {/* Logo with glow effect */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-blue-500 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            <img 
              src="/F.log1.png" 
              alt="Logo" 
              className="relative w-12 h-12 object-contain drop-shadow-lg transform group-hover:scale-110 transition-transform duration-300" 
            />
          </div>
          
          {/* Title with gradient text */}
          <div className="flex items-center">
            <h2 className="text-xl font-bold tracking-wide">
              <span className="bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Admin
              </span>
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent ml-2">
                Dashboard
              </span>
            </h2>
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-4">
          {/* Notification bell */}
          <button className="relative p-2 rounded-xl bg-gradient-to-br from-white to-gray-50 border border-gray-200/50 hover:border-pink-300 hover:shadow-lg hover:shadow-pink-200/30 transition-all duration-300 group">
            <Bell className="w-5 h-5 text-gray-500 group-hover:text-pink-500 transition-colors" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">3</span>
            </span>
          </button>

          {/* User profile section */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-white to-purple-50 border border-purple-200/50 hover:shadow-lg hover:shadow-purple-200/30 transition-all duration-300">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center transform hover:rotate-6 transition-transform duration-300">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={logout}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="relative overflow-hidden px-4 py-2 rounded-xl font-medium text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-pink-600 animate-gradient-shift bg-[length:200%_200%]" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-red-600 via-pink-600 to-red-600" />
            <span className="relative flex items-center gap-2">
              <LogOut className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
              <span className="hidden sm:inline">Logout</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
