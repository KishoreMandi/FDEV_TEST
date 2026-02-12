import { Navigate } from "react-router-dom";
import { useAuth } from "../context/auth";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" />;

  if (role) {
    if (Array.isArray(role)) {
      if (!role.includes(user.role)) return <Navigate to="/" />;
    } else {
      if (user.role !== role) return <Navigate to="/" />;
    }
  }

  return children;
};

export default ProtectedRoute;
