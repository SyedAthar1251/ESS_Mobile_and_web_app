import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

interface RouteGuardProps {
  allowedType: "admin" | "employee";
}

const RouteGuard = ({ allowedType }: RouteGuardProps) => {
  const { user, isCompanyAdmin, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userType = user?.userType || "employee";

  if (allowedType === "admin" && !isCompanyAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedType === "employee" && isCompanyAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};

export default RouteGuard;
