import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

interface RouteGuardProps {
  allowedType: "admin" | "employee";
}

const RouteGuard = ({ allowedType }: RouteGuardProps) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userType = user?.userType || "employee";

  if (allowedType === "admin" && userType !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedType === "employee" && userType === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default RouteGuard;
