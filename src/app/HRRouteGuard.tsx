import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { hasHRRole } from "../services/userRole.service";

const HRRouteGuard = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRoles: string[] = (user as any)?.roles || [];

  if (!hasHRRole(userRoles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default HRRouteGuard;
