function NotificationBell({ count = 0, onClick }) {
  return (
    <button
      type="button"
      className="notification-bell"
      onClick={onClick}
      aria-label="Notifications"
    >
      <span className="notification-bell__icon">
        🔔
      </span>

      {count > 0 && (
        <span className="notification-bell__badge">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;