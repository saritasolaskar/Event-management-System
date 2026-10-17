
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function MobileNavigation({
  items = [],
  isOpen,
  onClose,
}) {
  const { user } = useAuth();

  const visibleItems = items.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true;
    }

    return item.roles.includes(user?.role);
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="mobile-navigation">
      <div
        className="mobile-navigation__overlay"
        onClick={onClose}
      />

      <aside className="mobile-navigation__drawer">
        <div className="mobile-navigation__header">
          <strong>EMS</strong>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <nav>
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `mobile-navigation__link ${
                  isActive
                    ? "mobile-navigation__link--active"
                    : ""
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  );
}

export default MobileNavigation;
