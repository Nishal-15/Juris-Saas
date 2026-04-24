import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem("token");

  // console.log("Auth Status Check:", { hasUser: !!user, hasToken: !!token, role: user?.role });

  if (!user || !token) {
    console.warn("Unauthorized access attempt - Redirecting to Login");
    return <Navigate to="/" />;
  }

  // ✅ RBAC: Check if user has required role
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.error(`Access Denied: User role ${user.role} is not in ${allowedRoles}`);
    
    // Redirect to their respective "home" based on role
    if (user.role === "admin") return <Navigate to="/admin" />;
    if (user.role === "lawyer") return <Navigate to="/lawyer" />;
    return <Navigate to="/user" />;
  }

  return children;
}
