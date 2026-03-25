import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useUI } from "../context/UIContext";

const AdminLayout = ({ children }) => {
  const { isSidebarOpen, isMobile, closeSidebar } = useUI();

  return (
    <div className="flex min-h-screen bg-slate-50 relative overflow-x-hidden">
      {/* Sidebar - Desktop always visible, Mobile drawer style */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: isMobile ? '0' : '16rem' }}
      >
        <AdminHeader />
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
};

export default AdminLayout;
