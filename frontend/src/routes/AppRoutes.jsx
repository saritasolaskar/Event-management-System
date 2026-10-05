import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "../auth/ProtectedRoute";
import RoleRoute from "../auth/RoleRoute";

import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import ClientLayout from "../layouts/ClientLayout";
import DriverLayout from "../layouts/DriverLayout";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import SetPassword from "../pages/auth/SetPassword";
import Unauthorized from "../pages/auth/Unauthorized";

import { ROLES } from "../utils/roles";
import { ROUTES } from "./routeConfig";
import { AuthRedirect } from "./routeGuards";

import AdminDashboard from "./pages/admin/AdminDashboard";

function ClientDashboard() {
  return (
    <div className="page-container">
      <h1>Client Dashboard</h1>
      <p>
        Your event management dashboard will appear here.
      </p>
    </div>
  );
}

function ClientEvents() {
  return (
    <div className="page-container">
      <h1>My Events</h1>
      <p>Client events will be loaded from the API.</p>
    </div>
  );
}

function ClientInvoices() {
  return (
    <div className="page-container">
      <h1>Invoices</h1>
      <p>Client invoices will be loaded from the API.</p>
    </div>
  );
}

function DriverDashboard() {
  return (
    <div className="page-container">
      <h1>Driver Dashboard</h1>
      <p>
        Driver functionality will be connected to the
        backend in the driver module.
      </p>
    </div>
  );
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.REGISTER} element={<Register />} />
          <Route
            path={ROUTES.SET_PASSWORD}
            element={<SetPassword />}
          />
        </Route>

        <Route
          path={ROUTES.UNAUTHORIZED}
          element={<Unauthorized />}
        />

        {/* Root */}
        <Route path="/" element={<AuthRedirect />} />

        {/* Admin / internal operations */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <RoleRoute
                allowedRoles={[
                  ROLES.SUPER_ADMIN,
                  ROLES.ADMIN,
                  ROLES.OPERATIONS_MANAGER,
                  ROLES.DISPATCHER,
                  ROLES.ACCOUNTS,
                  ROLES.SUPPORT,
                ]}
              />
            }
          >
            <Route element={<AdminLayout />}>
              <Route
                path={ROUTES.ADMIN}
                element={
                  <Navigate
                    to={ROUTES.ADMIN_DASHBOARD}
                    replace
                  />
                }
              />

              <Route
                path={ROUTES.ADMIN_DASHBOARD}
                element={<AdminDashboard />}
              />
            </Route>
          </Route>
        </Route>

        {/* Client portal */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <RoleRoute allowedRoles={[ROLES.CLIENT]} />
            }
          >
            <Route element={<ClientLayout />}>
              <Route
                path={ROUTES.CLIENT}
                element={
                  <Navigate
                    to={ROUTES.CLIENT_DASHBOARD}
                    replace
                  />
                }
              />

              <Route
                path={ROUTES.CLIENT_DASHBOARD}
                element={<ClientDashboard />}
              />

              <Route
                path={ROUTES.CLIENT_EVENTS}
                element={<ClientEvents />}
              />

              <Route
                path={ROUTES.CLIENT_INVOICES}
                element={<ClientInvoices />}
              />
            </Route>
          </Route>
        </Route>

        {/* Driver portal */}
        <Route element={<ProtectedRoute />}>
          <Route
            element={
              <RoleRoute allowedRoles={[ROLES.DRIVER]} />
            }
          >
            <Route element={<DriverLayout />}>
              <Route
                path={ROUTES.DRIVER}
                element={
                  <Navigate
                    to={ROUTES.DRIVER_DASHBOARD}
                    replace
                  />
                }
              />

              <Route
                path={ROUTES.DRIVER_DASHBOARD}
                element={<DriverDashboard />}
              />
            </Route>
          </Route>
        </Route>

        {/* Catch-all */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;