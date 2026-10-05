import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";

import AuthContext from "./AuthContext";

const ProtectedRoute = () => {
  const {
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

  return <Outlet />;
};

export default ProtectedRoute;