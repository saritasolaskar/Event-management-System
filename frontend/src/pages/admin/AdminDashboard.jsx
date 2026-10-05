import { useEffect, useState } from "react";

function AdminDashboard() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dashboard API integration will be added in the next step.
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="dashboard-loading">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>
          <p>
            Overview of clients, events, guests, vehicles and
            operations.
          </p>
        </div>
      </div>

      <section className="dashboard-metrics">
        <div className="dashboard-card">
          <span className="dashboard-card__label">
            Active Clients
          </span>
          <strong className="dashboard-card__value">
            —
          </strong>
        </div>

        <div className="dashboard-card">
          <span className="dashboard-card__label">
            Upcoming Events
          </span>
          <strong className="dashboard-card__value">
            —
          </strong>
        </div>

        <div className="dashboard-card">
          <span className="dashboard-card__label">
            Confirmed Guests
          </span>
          <strong className="dashboard-card__value">
            —
          </strong>
        </div>

        <div className="dashboard-card">
          <span className="dashboard-card__label">
            Available Vehicles
          </span>
          <strong className="dashboard-card__value">
            —
          </strong>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <div>
            <h2>Recent Events</h2>
            <p>
              Recently created and upcoming events will appear
              here.
            </p>
          </div>
        </div>

        <div className="dashboard-empty">
          <h3>No event data loaded yet</h3>
          <p>
            The dashboard will be connected to the backend in
            the next step.
          </p>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section__header">
          <div>
            <h2>Fleet Snapshot</h2>
            <p>
              Current vehicle availability will appear here.
            </p>
          </div>
        </div>

        <div className="dashboard-empty">
          <h3>No fleet data loaded yet</h3>
          <p>
            Vehicle statistics will be connected to the
            backend in the next step.
          </p>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboard;