import { Outlet } from "react-router-dom";

function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <div className="auth-layout__logo">EMS</div>

        <div>
          <h1>Event Management System</h1>
          <p>
            Manage clients, events, transportation,
            billing and operations from one platform.
          </p>
        </div>
      </div>

      <main className="auth-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;