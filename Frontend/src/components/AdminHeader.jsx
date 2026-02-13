import { useAuth } from "../context/auth";

const AdminHeader = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex justify-between items-center bg-white px-6 py-4 shadow">
      <div className="flex items-center gap-4">
        <img 
          src="/F.log1.png" 
          alt="Logo" 
          className="w-12 h-12 object-contain mix-blend-multiply contrast-125 brightness-110" 
        />
        <h2 className="text-xl font-bold text-gray-800 tracking-wide">
          Admin Dashboard
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-600">{user?.name}</span>
        <button
          onClick={logout}
          className="bg-red-500 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminHeader;
