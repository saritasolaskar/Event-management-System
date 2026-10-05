import {
  Navigate,
  Outlet,
  useLocation
} from "react-router-dom";

import { useContext } from "react";

import AuthContext from "./AuthContext";

import { hasAnyRole } from "../utils/roles";

const RoleRoute = ({ allowedRoles = [] }) => {
  const {
    user,
    isAuthenticated,
    isLoading
  } = useContext(AuthContext);

  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname
        }}
      />
    );
  }

  if (!hasAnyRole(user, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RoleRoute;