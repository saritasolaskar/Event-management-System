import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";

const RESOURCE_CONFIG = [
  {
    key: "clients",
    label: "Clients",
    endpoint: "/clients",
    description: "Registered client organizations",
  },
  {
    key: "events",
    label: "Events",
    endpoint: "/events",
    description: "Events managed by the system",
  },
  {
    key: "guests",
    label: "Guests",
    endpoint: "/guests",
    description: "Guests registered across events",
  },
  {
    key: "drivers",
    label: "Drivers",
    endpoint: "/drivers",
    description: "Drivers available for operations",
  },
  {
    key: "vehicles",
    label: "Vehicles",
    endpoint: "/vehicles",
    description: "Vehicles available in the fleet",
  },
  {
    key: "vendors",
    label: "Vendors",
    endpoint: "/vendors",
    description: "Registered transport vendors",
  },
  {
    key: "locations",
    label: "Locations",
    endpoint: "/locations",
    description: "Configured pickup and event locations",
  },
];

function extractData(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.items)) {
    return response.data.items;
  }

  if (Array.isArray(response?.items)) {
    return response.items;
  }

  return [];
}

function getRecordStatus(record) {
  return String(
    record?.status ||
      record?.eventStatus ||
      record?.clientStatus ||
      ""
  )
    .trim()
    .toLowerCase();
}

function getActiveCount(records) {
  return records.filter((record) => {
    const status = getRecordStatus(record);

    if (!status) {
      return true;
    }

    return [
      "active",
      "ongoing",
      "in_progress",
      "confirmed",
      "approved",
      "scheduled",
      "available",
    ].includes(status);
  }).length;
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN").format(
    Number(value) || 0
  );
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getEventName(event) {
  return (
    event?.name ||
    event?.eventName ||
    event?.title ||
    "Unnamed event"
  );
}

function getEventClient(event) {
  if (typeof event?.client === "string") {
    return event.client;
  }

  return (
    event?.client?.name ||
    event?.clientName ||
    event?.companyName ||
    "Client not specified"
  );
}

function getEventDate(event) {
  return (
    event?.startDate ||
    event?.eventDate ||
    event?.date ||
    event?.startAt ||
    null
  );
}

function getInitials(name) {
  const value = String(name || "Event");

  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[parts.length - 1][0]
  ).toUpperCase();
}

export default function AdminDashboard({
  user,
}) {
  const [records, setRecords] = useState({
    clients: [],
    events: [],
    guests: [],
    drivers: [],
    vehicles: [],
    vendors: [],
    locations: [],
  });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState(null);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const responses =
        await Promise.allSettled(
          RESOURCE_CONFIG.map(
            (resource) =>
              api.request(resource.endpoint)
          )
        );

      const nextRecords = {
        clients: [],
        events: [],
        guests: [],
        drivers: [],
        vehicles: [],
        vendors: [],
        locations: [],
      };

      const failedResources = [];

      responses.forEach(
        (result, index) => {
          const resource =
            RESOURCE_CONFIG[index];

          if (
            result.status === "fulfilled"
          ) {
            nextRecords[resource.key] =
              extractData(result.value);
          } else {
            failedResources.push(
              resource.label
            );
          }
        }
      );

      setRecords(nextRecords);
      setLastUpdated(new Date());

      if (failedResources.length > 0) {
        setError(
          `Some dashboard data could not be loaded: ${failedResources.join(
            ", "
          )}.`
        );
      }
    } catch (requestError) {
      setError(
        requestError?.message ||
          "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const statistics = useMemo(
    () => [
      {
        key: "clients",
        label: "Total Clients",
        value: records.clients.length,
        active: getActiveCount(
          records.clients
        ),
        icon: "C",
      },
      {
        key: "events",
        label: "Total Events",
        value: records.events.length,
        active: getActiveCount(
          records.events
        ),
        icon: "E",
      },
      {
        key: "guests",
        label: "Total Guests",
        value: records.guests.length,
        active: getActiveCount(
          records.guests
        ),
        icon: "G",
      },
      {
        key: "drivers",
        label: "Total Drivers",
        value: records.drivers.length,
        active: getActiveCount(
          records.drivers
        ),
        icon: "D",
      },
      {
        key: "vehicles",
        label: "Total Vehicles",
        value: records.vehicles.length,
        active: getActiveCount(
          records.vehicles
        ),
        icon: "T",
      },
      {
        key: "vendors",
        label: "Total Vendors",
        value: records.vendors.length,
        active: getActiveCount(
          records.vendors
        ),
        icon: "V",
      },
    ],
    [records]
  );

  const recentEvents = useMemo(() => {
    return [...records.events]
      .sort((a, b) => {
        const dateA = new Date(
          getEventDate(a) || 0
        ).getTime();

        const dateB = new Date(
          getEventDate(b) || 0
        ).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }, [records.events]);

  const totalResources =
    records.clients.length +
    records.events.length +
    records.guests.length +
    records.drivers.length +
    records.vehicles.length +
    records.vendors.length +
    records.locations.length;

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">
            Administration
          </p>

          <h1>
            Welcome,{" "}
            {user?.name ||
              user?.fullName ||
              user?.username ||
              "Admin"}
          </h1>

          <p>
            Monitor your complete event
            management operation from one
            centralized dashboard.
          </p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="btn secondary"
            onClick={loadDashboard}
            disabled={loading}
          >
            {loading
              ? "Refreshing..."
              : "Refresh data"}
          </button>
        </div>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <section className="stats">
        {statistics.map((stat) => (
          <div
            className="stat"
            key={stat.key}
          >
            <div className="stat-top">
              <span className="stat-icon">
                {stat.icon}
              </span>

              <span className="stat-label">
                {stat.label}
              </span>
            </div>

            <strong>
              {loading
                ? "..."
                : formatNumber(stat.value)}
            </strong>

            <small>
              {loading
                ? "Loading"
                : `${formatNumber(
                    stat.active
                  )} active`}
            </small>
          </div>
        ))}
      </section>

      <section className="module-grid">
        <DashboardModule
          title="Operations overview"
          description="Current system resource counts"
        >
          <div className="overview-list">
            <OverviewRow
              label="Clients"
              value={
                records.clients.length
              }
            />

            <OverviewRow
              label="Events"
              value={
                records.events.length
              }
            />

            <OverviewRow
              label="Guests"
              value={
                records.guests.length
              }
            />

            <OverviewRow
              label="Drivers"
              value={
                records.drivers.length
              }
            />

            <OverviewRow
              label="Vehicles"
              value={
                records.vehicles.length
              }
            />

            <OverviewRow
              label="Vendors"
              value={
                records.vendors.length
              }
            />

            <OverviewRow
              label="Locations"
              value={
                records.locations.length
              }
            />
          </div>
        </DashboardModule>

        <DashboardModule
          title="System snapshot"
          description="Overall platform activity"
        >
          <div className="snapshot">
            <div>
              <span>
                Total managed records
              </span>

              <strong>
                {loading
                  ? "..."
                  : formatNumber(
                      totalResources
                    )}
              </strong>
            </div>

            <div>
              <span>
                Last refreshed
              </span>

              <strong>
                {loading
                  ? "..."
                  : lastUpdated
                  ? lastUpdated.toLocaleTimeString(
                      "en-IN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )
                  : "—"}
              </strong>
            </div>

            <div>
              <span>
                Locations configured
              </span>

              <strong>
                {loading
                  ? "..."
                  : formatNumber(
                      records.locations
                        .length
                    )}
              </strong>
            </div>
          </div>
        </DashboardModule>
      </section>

      <section className="panel">
        <div className="head">
          <div>
            <p className="eyebrow">
              Event activity
            </p>

            <h2>
              Recent events
            </h2>
          </div>

          <span className="panel-meta">
            {loading
              ? "Loading..."
              : `${records.events.length} total`}
          </span>
        </div>

        {loading ? (
          <div className="empty">
            <div className="spin" />
            <p>
              Loading recent events...
            </p>
          </div>
        ) : recentEvents.length ===
          0 ? (
          <div className="empty">
            <strong>
              No events found
            </strong>

            <p>
              Events created in the system
              will appear here.
            </p>
          </div>
        ) : (
          <div className="event-list">
            {recentEvents.map(
              (event, index) => (
                <div
                  className="event-row"
                  key={
                    event?._id ||
                    event?.id ||
                    `${getEventName(
                      event
                    )}-${index}`
                  }
                >
                  <div className="event-avatar">
                    {getInitials(
                      getEventName(event)
                    )}
                  </div>

                  <div className="event-main">
                    <strong>
                      {getEventName(event)}
                    </strong>

                    <span>
                      {getEventClient(event)}
                    </span>
                  </div>

                  <div className="event-date">
                    <span>
                      Event date
                    </span>

                    <strong>
                      {formatDate(
                        getEventDate(event)
                      )}
                    </strong>
                  </div>

                  <span
                    className={`pill ${getRecordStatus(
                      event
                    )}`}
                  >
                    {formatStatus(
                      event?.status
                    )}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </>
  );
}

/* =========================================================
   SUPPORTING COMPONENTS
========================================================= */

function DashboardModule({
  title,
  description,
  children,
}) {
  return (
    <section className="panel">
      <div className="head">
        <div>
          <p className="eyebrow">
            Dashboard
          </p>

          <h2>{title}</h2>

          <p className="muted">
            {description}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function OverviewRow({
  label,
  value,
}) {
  return (
    <div className="overview-row">
      <span>{label}</span>

      <strong>
        {formatNumber(value)}
      </strong>
    </div>
  );
}

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return String(status)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}