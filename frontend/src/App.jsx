import React, { useEffect, useState } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "./services/api";
import AdminDashboard from "./pages/admin/AdminDashboard";
const STORAGE_KEYS = {
  accessToken: "ems_accessToken",
  refreshToken: "ems_refreshToken",
  user: "ems_user",
};

/* =========================================================
   AUTH HELPERS
========================================================= */

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
  api.storage.clearAuthData();
}

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
}

function getRoleHome(role) {
  const normalizedRole = normalizeRole(role);

  switch (normalizedRole) {
    case "ADMIN":
      return "/admin/dashboard";

    case "OPERATIONS_MANAGER":
      return "/operations/dashboard";

    case "DISPATCHER":
      return "/operations/dashboard";

    case "CLIENT":
      return "/client/dashboard";

    case "DRIVER":
      return "/driver/dashboard";

    default:
      return "/login";
  }
}

/* =========================================================
   APP
========================================================= */

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      const token = getAccessToken();
      const storedUser = getStoredUser();

      if (!token || !storedUser) {
        if (mounted) {
          setUser(null);
          setAuthLoading(false);
        }

        return;
      }

      /*
        The backend uses access tokens with refresh tokens.
        We keep the locally stored user and only attempt a
        refresh when the access token is no longer usable.
      */

      try {
        const refreshedToken =
          await api.auth.refreshAccessToken();

        if (!mounted) {
          return;
        }

        if (refreshedToken) {
          setUser(api.storage.getStoredUser());
        } else {
          setUser(null);
        }
      } catch {
        if (mounted) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (mounted) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      {/* =====================================================
          PUBLIC
      ===================================================== */}

      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={getRoleHome(user.role)}
              replace
            />
          ) : (
            <LoginPage onLogin={setUser} />
          )
        }
      />

      {/* =====================================================
          ROOT
      ===================================================== */}

      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={getRoleHome(user.role)}
              replace
            />
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      {/* =====================================================
          ADMIN
      ===================================================== */}

      <Route
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={["ADMIN"]}
          />
        }
      >
        <Route
          path="/admin"
          element={<AdminLayout user={user} />}
        >
          <Route
            index
            element={
              <Navigate
                to="/admin/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <AdminDashboard user={user} />
            }
          />

          <Route
            path="clients"
            element={
              <PlaceholderPage
                title="Clients"
                description="Client management workspace."
              />
            }
          />

          <Route
            path="events"
            element={
              <PlaceholderPage
                title="Events"
                description="Event management workspace."
              />
            }
          />

          <Route
            path="guests"
            element={
              <PlaceholderPage
                title="Guests"
                description="Guest management workspace."
              />
            }
          />

          <Route
            path="vendors"
            element={
              <PlaceholderPage
                title="Vendors"
                description="Vendor management workspace."
              />
            }
          />

          <Route
            path="drivers"
            element={
              <PlaceholderPage
                title="Drivers"
                description="Driver management workspace."
              />
            }
          />

          <Route
            path="vehicles"
            element={
              <PlaceholderPage
                title="Vehicles"
                description="Vehicle management workspace."
              />
            }
          />

          <Route
            path="locations"
            element={
              <PlaceholderPage
                title="Locations"
                description="Location management workspace."
              />
            }
          />
        </Route>
      </Route>

      {/* =====================================================
          OPERATIONS MANAGER + DISPATCHER
      ===================================================== */}

      <Route
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={[
              "OPERATIONS_MANAGER",
              "DISPATCHER",
            ]}
          />
        }
      >
        <Route
          path="/operations"
          element={<OperationsLayout user={user} />}
        >
          <Route
            index
            element={
              <Navigate
                to="/operations/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <OperationsDashboard user={user} />
            }
          />

          <Route
            path="events"
            element={
              <PlaceholderPage
                title="Events"
                description="Operations event workspace."
              />
            }
          />

          <Route
            path="guests"
            element={
              <PlaceholderPage
                title="Guests"
                description="Guest dispatch and tracking workspace."
              />
            }
          />

          <Route
            path="drivers"
            element={
              <PlaceholderPage
                title="Drivers"
                description="Driver operations workspace."
              />
            }
          />

          <Route
            path="vehicles"
            element={
              <PlaceholderPage
                title="Vehicles"
                description="Vehicle operations workspace."
              />
            }
          />

          <Route
            path="locations"
            element={
              <PlaceholderPage
                title="Locations"
                description="Location operations workspace."
              />
            }
          />
        </Route>
      </Route>

      {/* =====================================================
          CLIENT
      ===================================================== */}

      <Route
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={["CLIENT"]}
          />
        }
      >
        <Route
          path="/client"
          element={<ClientLayout user={user} />}
        >
          <Route
            index
            element={
              <Navigate
                to="/client/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <ClientDashboard user={user} />
            }
          />

          <Route
            path="events"
            element={
              <PlaceholderPage
                title="My Events"
                description="Client event overview."
              />
            }
          />

          <Route
            path="events/:id"
            element={
              <PlaceholderPage
                title="Event Details"
                description="Detailed event information."
              />
            }
          />

          <Route
            path="invoices"
            element={
              <PlaceholderPage
                title="Invoices"
                description="Client invoices and billing."
              />
            }
          />
        </Route>
      </Route>

      {/* =====================================================
          DRIVER
      ===================================================== */}

      <Route
        element={
          <ProtectedRoute
            user={user}
            allowedRoles={["DRIVER"]}
          />
        }
      >
        <Route
          path="/driver"
          element={
            <DriverLayout
              user={user}
              onLogout={() => {
                clearAuth();
                setUser(null);
              }}
            />
          }
        >
          <Route
            index
            element={
              <Navigate
                to="/driver/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={
              <DriverDashboard user={user} />
            }
          />

          <Route
            path="guests"
            element={
              <PlaceholderPage
                title="Assigned Guests"
                description="Driver guest movement workspace."
              />
            }
          />
        </Route>
      </Route>

      {/* =====================================================
          404
      ===================================================== */}

      <Route
        path="*"
        element={
          <NotFoundPage user={user} />
        }
      />
    </Routes>
  );
}

/* =========================================================
   PROTECTED ROUTE
========================================================= */

function ProtectedRoute({
  user,
  allowedRoles = [],
}) {
  const location = useLocation();

  if (!user || !getAccessToken()) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  const role = normalizeRole(user.role);

  const allowed = allowedRoles.some(
    (allowedRole) =>
      normalizeRole(allowedRole) === role
  );

  if (!allowed) {
    return (
      <Navigate
        to={getRoleHome(role)}
        replace
      />
    );
  }

  return <Outlet />;
}

/* =========================================================
   LOGIN PAGE
========================================================= */

function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const authData =
        await api.auth.login(
          cleanEmail,
          password
        );

      const loggedInUser =
        authData.user;

      if (!loggedInUser) {
        throw new Error(
          "The server did not return user information."
        );
      }

      onLogin(loggedInUser);

      navigate(
        getRoleHome(
          loggedInUser.role
        ),
        {
          replace: true,
        }
      );
    } catch (loginError) {
      setError(
        loginError?.message ||
          "Unable to login. Please check your credentials and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark">
            EM
          </div>

          <div>
            <strong>
              Event Management
            </strong>

            <span>
              Unified Operations System
            </span>
          </div>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">
            Welcome back
          </p>

          <h1>
            Sign in to your workspace
          </h1>

          <p>
            Access your event management
            dashboard using your registered
            account.
          </p>
        </div>

        {error && (
          <div className="alert error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="form-grid"
        >
          <label>
            <span>Email address</span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              disabled={loading}
            />
          </label>

          <label>
            <span>Password</span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={loading}
            />
          </label>

          <button
            type="submit"
            className="btn primary"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================
   GENERIC APP SHELL
========================================================= */

function AppShell({
  user,
  title,
  navigation,
  children,
  onLogout,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const [loggingOut, setLoggingOut] =
    useState(false);

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await api.auth.logout();
    } catch {
      clearAuth();
    } finally {
      if (onLogout) {
        onLogout();
      }

      navigate("/login", {
        replace: true,
      });

      setLoggingOut(false);
    }
  }

  const currentPath =
    location.pathname;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            EM
          </div>

          <div>
            <strong>
              Event Management
            </strong>

            <span>
              Operations System
            </span>
          </div>
        </div>

        <nav>
          {navigation.map((item) => {
            const active =
              currentPath === item.path ||
              currentPath.startsWith(
                `${item.path}/`
              );

            return (
              <button
                key={item.path}
                type="button"
                className={
                  active
                    ? "nav-item active"
                    : "nav-item"
                }
                onClick={() =>
                  navigate(item.path)
                }
              >
                <span className="nav-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-mini">
            <div className="avatar">
              {getInitials(user)}
            </div>

            <div>
              <strong>
                {getUserName(user)}
              </strong>

              <span>
                {formatRole(user?.role)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            disabled={loggingOut}
          >
            {loggingOut
              ? "Signing out..."
              : "Sign out"}
          </button>
        </div>
      </aside>

      <main className="main">
        <header>
          <div>
            <span className="crumb">
              Workspace
            </span>

            <h2>{title}</h2>
          </div>

          <div className="header-user">
            <span>
              {formatRole(user?.role)}
            </span>

            <div className="avatar">
              {getInitials(user)}
            </div>
          </div>
        </header>

        <div className="page">
          {children}
        </div>
      </main>
    </div>
  );
}

/* =========================================================
   ADMIN LAYOUT
========================================================= */

function AdminLayout({ user }) {
  const navigation = [
    {
      label: "Dashboard",
      path: "/admin/dashboard",
      icon: "⌂",
    },
    {
      label: "Clients",
      path: "/admin/clients",
      icon: "C",
    },
    {
      label: "Events",
      path: "/admin/events",
      icon: "E",
    },
    {
      label: "Guests",
      path: "/admin/guests",
      icon: "G",
    },
    {
      label: "Vendors",
      path: "/admin/vendors",
      icon: "V",
    },
    {
      label: "Drivers",
      path: "/admin/drivers",
      icon: "D",
    },
    {
      label: "Vehicles",
      path: "/admin/vehicles",
      icon: "T",
    },
    {
      label: "Locations",
      path: "/admin/locations",
      icon: "L",
    },
  ];

  return (
    <AppShell
      user={user}
      title="Admin workspace"
      navigation={navigation}
    >
      <Outlet />
    </AppShell>
  );
}

/* =========================================================
   OPERATIONS LAYOUT
========================================================= */

function OperationsLayout({ user }) {
  const navigation = [
    {
      label: "Dashboard",
      path: "/operations/dashboard",
      icon: "⌂",
    },
    {
      label: "Events",
      path: "/operations/events",
      icon: "E",
    },
    {
      label: "Guests",
      path: "/operations/guests",
      icon: "G",
    },
    {
      label: "Drivers",
      path: "/operations/drivers",
      icon: "D",
    },
    {
      label: "Vehicles",
      path: "/operations/vehicles",
      icon: "T",
    },
    {
      label: "Locations",
      path: "/operations/locations",
      icon: "L",
    },
  ];

  return (
    <AppShell
      user={user}
      title="Operations workspace"
      navigation={navigation}
    >
      <Outlet />
    </AppShell>
  );
}

/* =========================================================
   CLIENT LAYOUT
========================================================= */

function ClientLayout({ user }) {
  const navigation = [
    {
      label: "Dashboard",
      path: "/client/dashboard",
      icon: "⌂",
    },
    {
      label: "My Events",
      path: "/client/events",
      icon: "E",
    },
    {
      label: "Invoices",
      path: "/client/invoices",
      icon: "₹",
    },
  ];

  return (
    <AppShell
      user={user}
      title="Client portal"
      navigation={navigation}
    >
      <Outlet />
    </AppShell>
  );
}

/* =========================================================
   DRIVER LAYOUT
========================================================= */

function DriverLayout({
  user,
  onLogout,
}) {
  const navigation = [
    {
      label: "Dashboard",
      path: "/driver/dashboard",
      icon: "⌂",
    },
    {
      label: "Assigned Guests",
      path: "/driver/guests",
      icon: "G",
    },
  ];

  return (
    <AppShell
      user={user}
      title="Driver workspace"
      navigation={navigation}
      onLogout={onLogout}
    >
      <Outlet />
    </AppShell>
  );
}


/* =========================================================
   OPERATIONS DASHBOARD
========================================================= */

function OperationsDashboard({ user }) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            Operations
          </p>

          <h1>
            Welcome,{" "}
            {getFirstName(user)}
          </h1>

          <p>
            Coordinate events, guests, drivers
            and vehicles from the operations
            workspace.
          </p>
        </div>
      </section>

      <section className="stats">
        <StatCard
          label="Today's Events"
          value="—"
        />

        <StatCard
          label="Guests"
          value="—"
        />

        <StatCard
          label="Drivers"
          value="—"
        />

        <StatCard
          label="Vehicles"
          value="—"
        />
      </section>

      <section className="panel">
        <div className="head">
          <div>
            <p className="eyebrow">
              Operations center
            </p>

            <h2>
              Ready for live data
            </h2>
          </div>
        </div>

        <p>
          Your role has been recognized by
          the backend. Operations-specific API
          modules will be connected next.
        </p>
      </section>
    </>
  );
}

/* =========================================================
   CLIENT DASHBOARD
========================================================= */

function ClientDashboard({ user }) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            Client portal
          </p>

          <h1>
            Welcome,{" "}
            {getFirstName(user)}
          </h1>

          <p>
            View your events, guest movement,
            vehicles, drivers and invoices from
            your client portal.
          </p>
        </div>
      </section>

      <section className="stats">
        <StatCard
          label="My Events"
          value="—"
        />

        <StatCard
          label="Guests"
          value="—"
        />

        <StatCard
          label="Vehicles"
          value="—"
        />

        <StatCard
          label="Invoices"
          value="—"
        />
      </section>

      <section className="panel">
        <div className="head">
          <div>
            <p className="eyebrow">
              Client portal
            </p>

            <h2>
              Your event information
            </h2>
          </div>
        </div>

        <p>
          Your authenticated client session is
          active. Event and invoice data will be
          loaded from the client portal APIs in
          the next stage.
        </p>
      </section>
    </>
  );
}

/* =========================================================
   DRIVER DASHBOARD
========================================================= */

function DriverDashboard({ user }) {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            Driver portal
          </p>

          <h1>
            Welcome,{" "}
            {getFirstName(user)}
          </h1>

          <p>
            View today's assignments and
            manage guest movement from your
            driver workspace.
          </p>
        </div>
      </section>

      <section className="stats">
        <StatCard
          label="Today's Duties"
          value="—"
        />

        <StatCard
          label="Assigned Guests"
          value="—"
        />

        <StatCard
          label="Completed"
          value="—"
        />
      </section>

      <section className="panel">
        <div className="head">
          <div>
            <p className="eyebrow">
              Driver operations
            </p>

            <h2>
              Assignment workspace
            </h2>
          </div>
        </div>

        <p>
          Your driver account is authenticated.
          The live guest movement APIs will be
          connected in the driver module.
        </p>
      </section>
    </>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

/* =========================================================
   PLACEHOLDER
========================================================= */

function PlaceholderPage({
  title,
  description,
}) {
  return (
    <section className="panel">
      <div className="head">
        <div>
          <p className="eyebrow">
            Module
          </p>

          <h1>{title}</h1>
        </div>
      </div>

      <p>{description}</p>

      <div className="callout">
        <strong>
          Module foundation ready
        </strong>

        <span>
          This page is connected to the
          unified routing system. The next
          implementation step will connect
          this module to its backend APIs.
        </span>
      </div>
    </section>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingScreen() {
  return (
    <div className="auth">
      <div className="auth-card loading-card">
        <div className="spin" />

        <h2>
          Loading workspace...
        </h2>

        <p>
          Restoring your authenticated session.
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   404
========================================================= */

function NotFoundPage({ user }) {
  const navigate = useNavigate();

  return (
    <div className="auth">
      <div className="auth-card">
        <p className="eyebrow">
          404
        </p>

        <h1>
          Page not found
        </h1>

        <p>
          The page you requested does not
          exist in this application.
        </p>

        <button
          type="button"
          className="btn primary"
          onClick={() =>
            navigate(
              user
                ? getRoleHome(user.role)
                : "/login"
            )
          }
        >
          Go to workspace
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   USER HELPERS
========================================================= */

function getUserName(user) {
  if (!user) {
    return "User";
  }

  return (
    user.name ||
    user.fullName ||
    user.username ||
    user.email ||
    "User"
  );
}

function getFirstName(user) {
  const name = getUserName(user);

  if (name.includes("@")) {
    return name.split("@")[0];
  }

  return name.split(" ")[0];
}

function getInitials(user) {
  const name = getUserName(user);

  if (!name) {
    return "U";
  }

  if (name.includes("@")) {
    return name.charAt(0).toUpperCase();
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

function formatRole(role) {
  if (!role) {
    return "User";
  }

  return String(role)
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}