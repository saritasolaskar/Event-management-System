import { NavLink } from "react-router-dom";

function Sidebar({
  items = [],
  title = "Event Management",
  onNavigate,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__logo">EMS</div>

        <div>
          <strong>{title}</strong>
          <span>Management System</span>
        </div>
      </div>

      <nav className="sidebar__nav">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onNavigate}
            className={({ isActive }) =>
              `sidebar__link ${
                isActive ? "sidebar__link--active" : ""
              }`
            }
          >
            {item.icon && (
              <span className="sidebar__icon">
                {item.icon}
              </span>
            )}

            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;