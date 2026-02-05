import { useAuth } from "../context/AuthContext";

const AdminHeader = () => {
  const { user, logout } = useAuth();

  return (
    <div className="flex justify-between items-center bg-white px-6 py-4 shadow">
      <h2 className="text-xl font-semibold">
        {user?.role === "trainer" ? "Trainer Dashboard" : "Admin Dashboard"}
      </h2>

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
