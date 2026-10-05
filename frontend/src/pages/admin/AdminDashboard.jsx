import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../auth/AuthContext";

import { getClients } from "../../api/client.api";
import { getEvents } from "../../api/event.api";
import { getGuests } from "../../api/guest.api";
import { getVehicles } from "../../api/vehicle.api";
import { getDrivers } from "../../api/driver.api";

import { ROLES } from "../../utils/roles";
import { getApiErrorMessage } from "../../utils/errorHandler";

import "../../styles/admin-dashboard.css";

function extractData(response) {
  return response?.data ?? response ?? [];
}

function getArray(response) {
  const data = extractData(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.clients)) {
    return data.clients;
  }

  if (Array.isArray(data?.events)) {
    return data.events;
  }

  if (Array.isArray(data?.guests)) {
    return data.guests;
  }

  if (Array.isArray(data?.vehicles)) {
    return data.vehicles;
  }

  if (Array.isArray(data?.drivers)) {
    return data.drivers;
  }

  return [];
}

function formatDate(date) {
  if (!date) {
    return "—";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getStatusClass(status) {
  if (!status) {
    return "";
  }

  return `status-${String(status).toLowerCase().replaceAll("_", "-")}`;
}

function AdminDashboard() {
  const { user } = useAuth();

  const [clients, setClients] = useState([]);
  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = user?.role;

  const canViewClients =
    role === ROLES.ADMIN ||
    role === ROLES.OPERATIONS_MANAGER;

  const canViewGuests =
    role === ROLES.ADMIN ||
    role === ROLES.OPERATIONS_MANAGER ||
    role === ROLES.DISPATCHER;

  const canViewVehicles =
    role === ROLES.ADMIN ||
    role === ROLES.OPERATIONS_MANAGER ||
    role === ROLES.DISPATCHER;

  const canViewDrivers =
    role === ROLES.ADMIN ||
    role === ROLES.OPERATIONS_MANAGER ||
    role === ROLES.DISPATCHER;

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError("");

      const requests = [];

      requests.push(
        getEvents().then((response) => ({
          type: "events",
          data: getArray(response),
        }))
      );

      if (canViewClients) {
        requests.push(
          getClients().then((response) => ({
            type: "clients",
            data: getArray(response),
          }))
        );
      }

      if (canViewGuests) {
        requests.push(
          getGuests().then((response) => ({
            type: "guests",
            data: getArray(response),
          }))
        );
      }

      if (canViewVehicles) {
        requests.push(
          getVehicles().then((response) => ({
            type: "vehicles",
            data: getArray(response),
          }))
        );
      }

      if (canViewDrivers) {
        requests.push(
          getDrivers().then((response) => ({
            type: "drivers",
            data: getArray(response),
          }))
        );
      }

      const results = await Promise.allSettled(requests);

      if (!mounted) {
        return;
      }

      let failedRequests = 0;

      results.forEach((result) => {
        if (result.status === "rejected") {
          failedRequests += 1;
          return;
        }

        const { type, data } = result.value;

        if (type === "clients") {
          setClients(data);
        }

        if (type === "events") {
          setEvents(data);
        }

        if (type === "guests") {
          setGuests(data);
        }

        if (type === "vehicles") {
          setVehicles(data);
        }

        if (type === "drivers") {
          setDrivers(data);
        }
      });

      if (failedRequests > 0) {
        setError(
          "Some dashboard information could not be loaded."
        );
      }

      setLoading(false);
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [
    canViewClients,
    canViewGuests,
    canViewVehicles,
    canViewDrivers,
  ]);

  const metrics = useMemo(() => {
    const activeClients = clients.filter(
      (client) => client.status === "ACTIVE"
    ).length;

    const upcomingEvents = events.filter(
      (event) => event.status === "UPCOMING"
    ).length;

    const confirmedGuests = guests.filter(
      (guest) => guest.status === "CONFIRMED"
    ).length;

    const availableVehicles = vehicles.filter(
      (vehicle) => vehicle.status === "AVAILABLE"
    ).length;

    return {
      activeClients,
      upcomingEvents,
      confirmedGuests,
      availableVehicles,
    };
  }, [clients, events, guests, vehicles]);

  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => {
        const dateA = new Date(
          a.startDate || a.createdAt || 0
        ).getTime();

        const dateB = new Date(
          b.startDate || b.createdAt || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [events]);

  const fleetSnapshot = useMemo(() => {
    const statuses = [
      "AVAILABLE",
      "ASSIGNED",
      "ON_DUTY",
      "MAINTENANCE",
      "INACTIVE",
    ];

    return statuses.map((status) => ({
      status,
      count: vehicles.filter(
        (vehicle) => vehicle.status === status
      ).length,
    }));
  }, [vehicles]);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="dashboard-loading">
          <div className="dashboard-spinner" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <div>
          <span className="dashboard-eyebrow">
            Operations Overview
          </span>

          <h1>Admin Dashboard</h1>

          <p>
            Monitor clients, events, guests and transportation
            operations from one place.
          </p>
        </div>

        <div className="dashboard-user">
          <span>Signed in as</span>
          <strong>{user?.name || user?.email || "User"}</strong>
        </div>
      </header>

      {error && (
        <div className="dashboard-alert">
          <strong>Partial data loading</strong>
          <span>{error}</span>
        </div>
      )}

      <section className="dashboard-metrics">
        {canViewClients && (
          <div className="dashboard-card">
            <div className="dashboard-card__top">
              <span className="dashboard-card__icon">
                C
              </span>

              <span className="dashboard-card__trend">
                Live
              </span>
            </div>

            <span className="dashboard-card__label">
              Active Clients
            </span>

            <strong className="dashboard-card__value">
              {metrics.activeClients}
            </strong>
          </div>
        )}

        <div className="dashboard-card">
          <div className="dashboard-card__top">
            <span className="dashboard-card__icon">
              E
            </span>

            <span className="dashboard-card__trend">
              Live
            </span>
          </div>

          <span className="dashboard-card__label">
            Upcoming Events
          </span>

          <strong className="dashboard-card__value">
            {metrics.upcomingEvents}
          </strong>
        </div>

        {canViewGuests && (
          <div className="dashboard-card">
            <div className="dashboard-card__top">
              <span className="dashboard-card__icon">
                G
              </span>

              <span className="dashboard-card__trend">
                Live
              </span>
            </div>

            <span className="dashboard-card__label">
              Confirmed Guests
            </span>

            <strong className="dashboard-card__value">
              {metrics.confirmedGuests}
            </strong>
          </div>
        )}

        {canViewVehicles && (
          <div className="dashboard-card">
            <div className="dashboard-card__top">
              <span className="dashboard-card__icon">
                V
              </span>

              <span className="dashboard-card__trend">
                Live
              </span>
            </div>

            <span className="dashboard-card__label">
              Available Vehicles
            </span>

            <strong className="dashboard-card__value">
              {metrics.availableVehicles}
            </strong>
          </div>
        )}
      </section>

      <div className="dashboard-grid">
        <section className="dashboard-panel dashboard-panel--wide">
          <div className="dashboard-panel__header">
            <div>
              <span className="dashboard-panel__eyebrow">
                Events
              </span>

              <h2>Recent Events</h2>
            </div>

            <span className="dashboard-count">
              {events.length} total
            </span>
          </div>

          {recentEvents.length === 0 ? (
            <div className="dashboard-empty">
              <h3>No events found</h3>
              <p>
                Events created in the system will appear here.
              </p>
            </div>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Client</th>
                    <th>Start Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {recentEvents.map((event) => (
                    <tr key={event._id || event.id}>
                      <td>
                        <strong>
                          {event.name ||
                            event.eventCode ||
                            "Unnamed Event"}
                        </strong>

                        {event.eventCode &&
                          event.name && (
                            <small>
                              {event.eventCode}
                            </small>
                          )}
                      </td>

                      <td>
                        {event.client?.companyName ||
                          event.client?.name ||
                          "—"}
                      </td>

                      <td>
                        {formatDate(event.startDate)}
                      </td>

                      <td>
                        <span
                          className={`dashboard-status ${getStatusClass(
                            event.status
                          )}`}
                        >
                          {event.status || "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {canViewVehicles && (
          <section className="dashboard-panel">
            <div className="dashboard-panel__header">
              <div>
                <span className="dashboard-panel__eyebrow">
                  Transportation
                </span>

                <h2>Fleet Snapshot</h2>
              </div>
            </div>

            <div className="fleet-list">
              {fleetSnapshot.map((item) => (
                <div
                  className="fleet-row"
                  key={item.status}
                >
                  <span>
                    {item.status.replaceAll("_", " ")}
                  </span>

                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <section className="dashboard-panel dashboard-summary">
        <div className="dashboard-panel__header">
          <div>
            <span className="dashboard-panel__eyebrow">
              System Summary
            </span>

            <h2>Operational Resources</h2>
          </div>
        </div>

        <div className="summary-grid">
          {canViewClients && (
            <div className="summary-item">
              <span>Clients</span>
              <strong>{clients.length}</strong>
            </div>
          )}

          <div className="summary-item">
            <span>Events</span>
            <strong>{events.length}</strong>
          </div>

          {canViewGuests && (
            <div className="summary-item">
              <span>Guests</span>
              <strong>{guests.length}</strong>
            </div>
          )}

          {canViewVehicles && (
            <div className="summary-item">
              <span>Vehicles</span>
              <strong>{vehicles.length}</strong>
            </div>
          )}

          {canViewDrivers && (
            <div className="summary-item">
              <span>Drivers</span>
              <strong>{drivers.length}</strong>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;