import { useAuth } from "../context/auth";
import { Bell, User, LogOut } from "lucide-react";

const AdminHeader = () => {
  const { user, logout } = useAuth();

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
            <img
              src="/F.log1.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Admin Dashboard
            </h2>
          
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] text-white font-semibold flex items-center justify-center">
              3
            </span>
          </button>

          <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-slate-50 border border-slate-200">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-slate-900">
                {user?.name}
              </p>
              <p className="text-xs text-slate-500">
                Administrator
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 active:bg-rose-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">
              Logout
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
