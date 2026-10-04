
import React, { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

const STORAGE_KEYS = {
  accessToken: "ems_accessToken",
  refreshToken: "ems_refreshToken",
  user: "ems_user",
};

function getStoredUser() {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.user);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function getAccessToken() {
  return localStorage.getItem(STORAGE_KEYS.accessToken);
}

function clearAuth() {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
}

function normalizeRole(role) {
  if (!role) return "";

  return String(role)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function getRoleHome(role) {
  switch (normalizeRole(role)) {
    case "ADMIN":
      return "/admin/dashboard";

    case "OPERATIONS_MANAGER":
      return "/admin/dashboard";

    case "DISPATCHER":
      return "/admin/dashboard";

    case "CLIENT":
      return "/client/dashboard";

    case "DRIVER":
      return "/driver/dashboard";

    default:
      return "/login";
  }
}

function LoadingScreen() {
  return (
    <div className="auth">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="brand-mark" style={{ margin: "0 auto" }}>
          EMS
        </div>

        <h1>Event Management System</h1>

        <p className="muted">
          Loading your workspace...
        </p>
      </div>
    </div>
  );
}

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="auth">
      <div className="auth-card" style={{ textAlign: "center" }}>
        <div className="brand-mark" style={{ margin: "0 auto" }}>
          404
        </div>

        <h1>Page not found</h1>

        <p className="muted">
          The page you are looking for does not exist.
        </p>

        <button
          className="btn primary full"
          onClick={() => navigate("/")}
        >
          Go to dashboard
        </button>
      </div>
    </div>
  );
}

function LoginPlaceholder({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    /*
      Temporary frontend login placeholder.

      The actual API authentication will be connected in the
      authentication service/page implementation.

      We intentionally do not fake a successful login here.
    */

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setError(
      "Authentication API is not connected yet. The login screen is ready for the API integration step."
    );
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div
          className="brand-mark"
          style={{ margin: "0 auto" }}
        >
          EMS
        </div>

        <h1>Event Management System</h1>

        <p className="muted">
          Sign in to continue to your workspace.
        </p>

        {error && <div className="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>

          <label>
            Role preview
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              style={{
                width: "100%",
                border: "1px solid #d8dce5",
                borderRadius: "8px",
                padding: "10px 11px",
                background: "#fff",
              }}
            >
              <option value="ADMIN">Admin</option>
              <option value="OPERATIONS_MANAGER">
                Operations Manager
              </option>
              <option value="DISPATCHER">Dispatcher</option>
              <option value="CLIENT">Client</option>
              <option value="DRIVER">Driver</option>
            </select>
          </label>

          <button className="btn primary full" type="submit">
            Sign in
          </button>
        </form>

        <span className="muted">
          Authentication will use the existing backend `/auth/login`
          endpoint.
        </span>
      </div>
    </div>
  );
}

function ProtectedRoute({ allowedRoles }) {
  const token = getAccessToken();
  const user = getStoredUser();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  const role = normalizeRole(user.role);

  if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.map(normalizeRole).includes(role)
  ) {
    return <Navigate to={getRoleHome(role)} replace />;
  }

  return <Outlet />;
}

function RoleLanding() {
  const user = getStoredUser();

  if (!user || !getAccessToken()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Navigate
      to={getRoleHome(user.role)}
      replace
    />
  );
}

function AdminPlaceholder() {
  const user = getStoredUser();

  return (
    <WorkspacePlaceholder
      title="Admin Workspace"
      description="The unified administration workspace will be built here."
      role={normalizeRole(user?.role)}
    />
  );
}

function ClientPlaceholder() {
  const user = getStoredUser();

  return (
    <WorkspacePlaceholder
      title="Client Portal"
      description="The client event and invoice portal will be built here."
      role={normalizeRole(user?.role)}
    />
  );
}

function DriverPlaceholder() {
  const user = getStoredUser();

  return (
    <WorkspacePlaceholder
      title="Driver Workspace"
      description="The driver dashboard and guest movement workflow will be built here."
      role={normalizeRole(user?.role)}
    />
  );
}

function WorkspacePlaceholder({
  title,
  description,
  role,
}) {
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">EMS</div>

          <div>
            <strong>Event Management</strong>
            <small>Unified Platform</small>
          </div>
        </div>

        <nav>
          <button
            className="nav active"
            type="button"
          >
            Dashboard
          </button>
        </nav>

        <div className="side-bottom">
          <div className="profile">
            <span>
              {(userInitial(getStoredUser()) || "U").toUpperCase()}
            </span>

            <div>
              <b>
                {getStoredUser()?.name ||
                  getStoredUser()?.email ||
                  "User"}
              </b>

              <small>{role || "USER"}</small>
            </div>
          </div>

          <button
            className="btn"
            style={{ width: "100%" }}
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="main">
        <header>
          <div className="crumb">
            <b>{title}</b>
          </div>

          <span className="pill">
            {role || "USER"}
          </span>
        </header>

        <section className="page">
          <div className="hero">
            <div>
              <span className="eyebrow">
                EVENT MANAGEMENT SYSTEM
              </span>

              <h2>{title}</h2>

              <p>{description}</p>
            </div>
          </div>

          <div className="panel callout">
            <div>
              <b>Frontend foundation is ready</b>

              <p>
                This is the unified React application. The next
                implementation steps will connect the existing backend
                APIs and build the complete role-specific screens.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function userInitial(user) {
  if (!user) return "U";

  if (user.name) {
    return String(user.name).charAt(0);
  }

  if (user.email) {
    return String(user.email).charAt(0);
  }

  return "U";
}

function App() {
  const [initializing, setInitializing] = useState(true);

  const location = useLocation();

  useEffect(() => {
    /*
      Authentication persistence is handled through localStorage
      for the current frontend foundation.

      The real refresh-token workflow will be implemented in the
      API service layer.
    */

    const timer = window.setTimeout(() => {
      setInitializing(false);
    }, 100);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    /*
      Keep the browser at the top when changing application routes.
    */
    window.scrollTo({
      top: 0,
      behavior: "instant",
    });
  }, [location.pathname]);

  if (initializing) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPlaceholder />} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route
          path="/admin/*"
          element={<AdminPlaceholder />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["CLIENT"]}
          />
        }
      >
        <Route
          path="/client/*"
          element={<ClientPlaceholder />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={["DRIVER"]}
          />
        }
      >
        <Route
          path="/driver/*"
          element={<DriverPlaceholder />}
        />
      </Route>

      <Route
        element={
          <ProtectedRoute
            allowedRoles={[
              "OPERATIONS_MANAGER",
              "DISPATCHER",
            ]}
          />
        }
      >
        <Route
          path="/operations/*"
          element={<AdminPlaceholder />}
        />
      </Route>

      <Route
        path="/"
        element={<RoleLanding />}
      />

      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}

export default App;