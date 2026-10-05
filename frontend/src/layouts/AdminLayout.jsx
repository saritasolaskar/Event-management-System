import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import MobileNavigation from "./MobileNavigation";

import { ADMIN_ROUTES } from "../routes/routeConfig";

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const currentRoute = ADMIN_ROUTES.find(
    (item) => item.path === location.pathname
  );

  const title = currentRoute?.label || "Dashboard";

  return (
    <div className="app-shell">
      <Sidebar items={ADMIN_ROUTES} />

      <MobileNavigation
        items={ADMIN_ROUTES}
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="app-shell__main">
        <Topbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;