import { useAuth } from "../auth/AuthContext";
import NotificationBell from "./NotificationBell";

function Topbar({
  title = "Dashboard",
  onMenuClick,
}) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          type="button"
          className="topbar__menu"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          ☰
        </button>

        <div>
          <h1>{title}</h1>
          <span className="topbar__subtitle">
            Event Management System
          </span>
        </div>
      </div>

      <div className="topbar__right">
        <NotificationBell />

        <div className="topbar__user">
          <div className="topbar__avatar">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="topbar__user-info">
            <strong>{user?.name || "User"}</strong>
            <span>{user?.role || "USER"}</span>
          </div>
        </div>

        <button
          type="button"
          className="topbar__logout"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Topbar;