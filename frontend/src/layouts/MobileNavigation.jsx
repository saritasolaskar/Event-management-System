import { NavLink } from "react-router-dom";

function MobileNavigation({
  items = [],
  isOpen,
  onClose,
}) {
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
          {items.map((item) => (
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