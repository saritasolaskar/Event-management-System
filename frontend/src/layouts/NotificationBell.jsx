
import { useCallback, useEffect, useState } from "react";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../api/notification.api";

import "../styles/notification-bell.css";

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getId(notification) {
  return notification?._id || notification?.id || "";
}

function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getNotifications();
      const data = unwrap(response);

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.notifications)
          ? data.notifications
          : Array.isArray(data?.items)
            ? data.items
            : [];

      setNotifications(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  async function handleMarkRead(notification) {
    const id = getId(notification);

    if (!id || notification.isRead || busyId) return;

    setBusyId(id);
    setError("");

    try {
      await markNotificationAsRead(id);

      setNotifications((current) =>
        current.map((item) =>
          getId(item) === id
            ? {
                ...item,
                isRead: true,
                readAt: new Date().toISOString(),
              }
            : item
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  async function handleMarkAllRead() {
    if (unreadCount === 0 || markingAll) return;

    setMarkingAll(true);
    setError("");

    try {
      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleDelete(notification) {
    const id = getId(notification);

    if (!id || busyId) return;

    setBusyId(id);
    setError("");

    try {
      await deleteNotification(id);

      setNotifications((current) =>
        current.filter((item) => getId(item) !== id)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="notification">
      <button
        type="button"
        className="notification-bell"
        onClick={() => {
          setIsOpen((open) => !open);

          if (!isOpen) {
            loadNotifications();
          }
        }}
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <span className="notification-bell__icon">
          🔔
        </span>

        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          className="notification-panel"
          role="dialog"
          aria-label="Notifications"
        >
          <header className="notification-panel__header">
            <div>
              <h2>Notifications</h2>
              <p>
                {unreadCount} unread
              </p>
            </div>

            <button
              type="button"
              className="notification-panel__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close notifications"
            >
              ×
            </button>
          </header>

          <div className="notification-panel__actions">
            <button
              type="button"
              onClick={loadNotifications}
              disabled={loading}
            >
              {loading ? "Refreshing…" : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || markingAll}
            >
              {markingAll ? "Updating…" : "Mark all read"}
            </button>
          </div>

          {error && (
            <p
              className="notification-panel__error"
              role="alert"
            >
              {error}
            </p>
          )}

          {loading && notifications.length === 0 ? (
            <p className="notification-panel__message">
              Loading notifications…
            </p>
          ) : notifications.length === 0 ? (
            <p className="notification-panel__message">
              You're all caught up. No notifications yet.
            </p>
          ) : (
            <ul className="notification-list">
              {notifications.map((notification) => {
                const id = getId(notification);

                return (
                  <li
                    key={id}
                    className={`notification-item ${
                      notification.isRead
                        ? "notification-item--read"
                        : "notification-item--unread"
                    }`}
                  >
                    <div className="notification-item__content">
                      <div className="notification-item__title">
                        {!notification.isRead && (
                          <span
                            className="notification-item__dot"
                            aria-label="Unread"
                          />
                        )}

                        <strong>
                          {notification.title || "Notification"}
                        </strong>
                      </div>

                      <p>
                        {notification.message ||
                          "You have a new notification."}
                      </p>

                      <time>
                        {formatDate(notification.createdAt)}
                      </time>
                    </div>

                    <div className="notification-item__actions">
                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() =>
                            handleMarkRead(notification)
                          }
                          disabled={busyId === id}
                        >
                          Mark read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(notification)
                        }
                        disabled={busyId === id}
                        aria-label={`Delete notification: ${
                          notification.title || "Notification"
                        }`}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

export default NotificationBell;
