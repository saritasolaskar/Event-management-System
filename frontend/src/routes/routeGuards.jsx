import { Navigate } from "react-router-dom";

import { useAuth } from "../auth/AuthContext";
import { ROLE_HOME, ROUTES } from "./routeConfig";

export function AuthRedirect() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="route-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const destination =
    ROLE_HOME[user?.role] || ROUTES.UNAUTHORIZED;

  return <Navigate to={destination} replace />;
}