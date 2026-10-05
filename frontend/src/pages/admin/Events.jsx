
import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  CalendarDays,
  Building2,
  MapPin,
  X,
  Save,
  Eye,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
} from "lucide-react";

import api from "../../services/api";

const EVENT_STATUS = {
  UPCOMING: "UPCOMING",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const STATUS_OPTIONS = [
  EVENT_STATUS.UPCOMING,
  EVENT_STATUS.ONGOING,
  EVENT_STATUS.COMPLETED,
  EVENT_STATUS.CANCELLED,
];

const EMPTY_FORM = {
  eventCode: "",
  name: "",
  client: "",
  venue: "",
  startDate: "",
  endDate: "",
  description: "",
};

function extractRecords(response, keys = []) {
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  return [];
}

function extractRecord(response) {
  const data = response?.data ?? response;

  if (data?.event) {
    return data.event;
  }

  if (data?.client) {
    return data.client;
  }

  if (data?.location) {
    return data.location;
  }

  return data;
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

function formatDateTime(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toInputDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getStatusClass(status) {
  switch (status) {
    case EVENT_STATUS.UPCOMING:
      return "status-upcoming";

    case EVENT_STATUS.ONGOING:
      return "status-ongoing";

    case EVENT_STATUS.COMPLETED:
      return "status-completed";

    case EVENT_STATUS.CANCELLED:
      return "status-cancelled";

    default:
      return "";
  }
}

function getStatusIcon(status) {
  switch (status) {
    case EVENT_STATUS.UPCOMING:
      return <Clock size={14} />;

    case EVENT_STATUS.ONGOING:
      return <PlayCircle size={14} />;

    case EVENT_STATUS.COMPLETED:
      return <CheckCircle2 size={14} />;

    case EVENT_STATUS.CANCELLED:
      return <XCircle size={14} />;

    default:
      return null;
  }
}

function getClientName(event) {
  if (!event?.client) {
    return "—";
  }

  if (typeof event.client === "string") {
    return event.client;
  }

  return (
    event.client.companyName ||
    event.client.name ||
    "—"
  );
}

function getVenueName(event) {
  if (!event?.venue) {
    return "—";
  }

  if (typeof event.venue === "string") {
    return event.venue;
  }

  return (
    event.venue.name ||
    event.venue.locationCode ||
    "—"
  );
}

function getVenueLocation(event) {
  if (!event?.venue || typeof event.venue === "string") {
    return "";
  }

  return [event.venue.city, event.venue.state]
    .filter(Boolean)
    .join(", ");
}

export default function Events() {
  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingReferences, setLoadingReferences] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.request("/events", {
        method: "GET",
      });

      setEvents(
        extractRecords(response, [
          "events",
          "results",
        ])
      );
    } catch (err) {
      console.error("Failed to load events:", err);
      setError(
        err.message || "Failed to load events."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadReferences = async () => {
    try {
      setLoadingReferences(true);

      const [clientsResponse, locationsResponse] =
        await Promise.all([
          api.request("/clients", {
            method: "GET",
          }),

          api.request("/locations", {
            method: "GET",
          }),
        ]);

      setClients(
        extractRecords(clientsResponse, [
          "clients",
          "results",
        ])
      );

      setLocations(
        extractRecords(locationsResponse, [
          "locations",
          "results",
        ])
      );
    } catch (err) {
      console.error(
        "Failed to load event references:",
        err
      );

      setError(
        err.message ||
          "Failed to load clients and locations."
      );
    } finally {
      setLoadingReferences(false);
    }
  };

  useEffect(() => {
    loadEvents();
    loadReferences();
  }, []);

  useEffect(() => {
    if (!success) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const statistics = useMemo(() => {
    return {
      total: events.length,

      upcoming: events.filter(
        (event) =>
          event.status === EVENT_STATUS.UPCOMING
      ).length,

      ongoing: events.filter(
        (event) =>
          event.status === EVENT_STATUS.ONGOING
      ).length,

      completed: events.filter(
        (event) =>
          event.status === EVENT_STATUS.COMPLETED
      ).length,

      cancelled: events.filter(
        (event) =>
          event.status === EVENT_STATUS.CANCELLED
      ).length,
    };
  }, [events]);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const clientName =
        getClientName(event).toLowerCase();

      const venueName =
        getVenueName(event).toLowerCase();

      const venueLocation =
        getVenueLocation(event).toLowerCase();

      const matchesSearch =
        !query ||
        event.eventCode
          ?.toLowerCase()
          .includes(query) ||
        event.name
          ?.toLowerCase()
          .includes(query) ||
        clientName.includes(query) ||
        venueName.includes(query) ||
        venueLocation.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        event.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [events, search, statusFilter]);

  const openAddModal = () => {
    setEditingEvent(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (event) => {
    setEditingEvent(event);

    const clientId =
      typeof event.client === "object"
        ? event.client?._id
        : event.client;

    const venueId =
      typeof event.venue === "object"
        ? event.venue?._id
        : event.venue;

    setForm({
      eventCode: event.eventCode || "",
      name: event.name || "",
      client: clientId || "",
      venue: venueId || "",
      startDate: toInputDate(event.startDate),
      endDate: toInputDate(event.endDate),
      description: event.description || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) {
      return;
    }

    setShowModal(false);
    setEditingEvent(null);
    setForm(EMPTY_FORM);
  };

  const openDetails = (event) => {
    setViewingEvent(event);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setViewingEvent(null);
    setShowDetails(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.eventCode.trim()) {
      return "Event code is required.";
    }

    if (!form.name.trim()) {
      return "Event name is required.";
    }

    if (!form.client) {
      return "Please select a client.";
    }

    if (!form.venue) {
      return "Please select a venue.";
    }

    if (!form.startDate) {
      return "Start date is required.";
    }

    if (!form.endDate) {
      return "End date is required.";
    }

    if (
      new Date(form.endDate) <
      new Date(form.startDate)
    ) {
      return "End date cannot be before start date.";
    }

    return "";
  };

  const buildPayload = () => {
    const payload = {
      eventCode: form.eventCode
        .trim()
        .toUpperCase(),

      name: form.name.trim(),

      client: form.client,

      venue: form.venue,

      startDate: form.startDate,

      endDate: form.endDate,
    };

    if (form.description.trim()) {
      payload.description =
        form.description.trim();
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = buildPayload();

      if (editingEvent) {
        const eventId =
          editingEvent._id ||
          editingEvent.id;

        await api.request(
          `/events/${eventId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        setSuccess(
          "Event updated successfully."
        );
      } else {
        await api.request("/events", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess(
          "Event created successfully."
        );
      }

      closeModal();

      await loadEvents();
    } catch (err) {
      console.error(
        "Failed to save event:",
        err
      );

      setError(
        err.message ||
          "Failed to save event."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (event) => {
    const eventId =
      event._id || event.id;

    const confirmed = window.confirm(
      `Delete "${event.name}"?\n\n` +
        "The event can only be deleted if it has no operational data such as guests or vehicle assignments."
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(eventId);
      setError("");

      await api.request(
        `/events/${eventId}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Event deleted successfully."
      );

      await loadEvents();
    } catch (err) {
      console.error(
        "Failed to delete event:",
        err
      );

      setError(
        err.message ||
          "Failed to delete event."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleStatusChange = async (
    event,
    nextStatus
  ) => {
    const eventId =
      event._id || event.id;

    if (event.status === nextStatus) {
      return;
    }

    let confirmationMessage =
      `Change "${event.name}" status from ${event.status} to ${nextStatus}?`;

    if (
      nextStatus ===
        EVENT_STATUS.COMPLETED ||
      nextStatus ===
        EVENT_STATUS.CANCELLED
    ) {
      confirmationMessage +=
        "\n\nMake sure all active vehicle assignments have been completed or cancelled first.";
    }

    const confirmed = window.confirm(
      confirmationMessage
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionId(eventId);
      setError("");

      await api.request(
        `/events/${eventId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      setSuccess(
        `Event status changed to ${nextStatus}.`
      );

      await loadEvents();
    } catch (err) {
      console.error(
        "Failed to update event status:",
        err
      );

      setError(
        err.message ||
          "Failed to update event status."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleRefresh = async () => {
    setError("");

    await Promise.all([
      loadEvents(),
      loadReferences(),
    ]);

    setSuccess(
      "Event list refreshed."
    );
  };

  return (
    <div className="page">
      <section className="hero">
        <div className="head">
          <div>
            <div className="eyebrow">
              EVENT MANAGEMENT
            </div>

            <h1>Events</h1>

            <p className="muted">
              Create and manage events, venues,
              clients and operational status.
            </p>
          </div>

          <div className="hero-actions">
            <button
              className="btn secondary"
              onClick={handleRefresh}
              disabled={
                loading ||
                loadingReferences
              }
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              className="btn primary"
              onClick={openAddModal}
              disabled={loadingReferences}
            >
              <Plus size={16} />
              Create Event
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert success">
          {success}
        </div>
      )}

      <section className="stats">
        <div className="stat">
          <div className="stat-top">
            <div>
              <div className="stat-label">
                Total Events
              </div>

              <strong>
                {statistics.total}
              </strong>
            </div>

            <div className="stat-icon">
              <CalendarDays size={20} />
            </div>
          </div>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div>
              <div className="stat-label">
                Upcoming
              </div>

              <strong>
                {statistics.upcoming}
              </strong>
            </div>

            <div className="stat-icon">
              <Clock size={20} />
            </div>
          </div>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div>
              <div className="stat-label">
                Ongoing
              </div>

              <strong>
                {statistics.ongoing}
              </strong>
            </div>

            <div className="stat-icon">
              <PlayCircle size={20} />
            </div>
          </div>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div>
              <div className="stat-label">
                Completed
              </div>

              <strong>
                {statistics.completed}
              </strong>
            </div>

            <div className="stat-icon">
              <CheckCircle2 size={20} />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <Search size={17} />

            <input
              type="text"
              placeholder="Search events, clients or venues..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All statuses
            </option>

            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              )
            )}
          </select>
        </div>

        {loading ? (
          <div className="empty">
            <div className="spin">
              <RefreshCw size={24} />
            </div>

            <p>
              Loading events...
            </p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty">
            <CalendarDays size={34} />

            <h3>
              No events found
            </h3>

            <p>
              {events.length === 0
                ? "Create your first event to get started."
                : "Try changing your search or status filter."}
            </p>

            {events.length === 0 && (
              <button
                className="btn primary"
                onClick={openAddModal}
                disabled={
                  loadingReferences
                }
              >
                <Plus size={16} />
                Create Event
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Client</th>
                  <th>Venue</th>
                  <th>Schedule</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredEvents.map(
                  (event) => {
                    const eventId =
                      event._id ||
                      event.id;

                    const isBusy =
                      actionId ===
                      eventId;

                    return (
                      <tr
                        key={eventId}
                      >
                        <td>
                          <div className="event-row">
                            <div className="event-avatar">
                              <CalendarDays
                                size={17}
                              />
                            </div>

                            <div className="event-main">
                              <strong>
                                {event.name ||
                                  "Unnamed Event"}
                              </strong>

                              <span className="muted">
                                {event.eventCode ||
                                  "No code"}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="event-row">
                            <Building2
                              size={16}
                            />

                            <span>
                              {getClientName(
                                event
                              )}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div>
                            <div className="event-row">
                              <MapPin
                                size={16}
                              />

                              <span>
                                {getVenueName(
                                  event
                                )}
                              </span>
                            </div>

                            {getVenueLocation(
                              event
                            ) && (
                              <div className="muted">
                                {getVenueLocation(
                                  event
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <div>
                            <strong>
                              {formatDate(
                                event.startDate
                              )}
                            </strong>

                            <div className="muted">
                              to{" "}
                              {formatDate(
                                event.endDate
                              )}
                            </div>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`pill ${getStatusClass(
                              event.status
                            )}`}
                          >
                            {getStatusIcon(
                              event.status
                            )}

                            {event.status ||
                              "UNKNOWN"}
                          </span>
                        </td>

                        <td>
                          <div className="table-actions">
                            <button
                              className="btn icon"
                              title="View event"
                              onClick={() =>
                                openDetails(
                                  event
                                )
                              }
                              disabled={
                                isBusy
                              }
                            >
                              <Eye
                                size={16}
                              />
                            </button>

                            <button
                              className="btn icon"
                              title="Edit event"
                              onClick={() =>
                                openEditModal(
                                  event
                                )
                              }
                              disabled={
                                isBusy
                              }
                            >
                              <Pencil
                                size={16}
                              />
                            </button>

                            <button
                              className="btn icon danger"
                              title="Delete event"
                              onClick={() =>
                                handleDelete(
                                  event
                                )
                              }
                              disabled={
                                isBusy
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {filteredEvents.length > 0 && (
        <section className="panel" style={{ marginTop: 16 }}>
          <div
            style={{
              padding: "16px 18px",
              borderBottom:
                "1px solid #edf0f4",
            }}
          >
            <strong>
              Quick Status Management
            </strong>

            <div
              className="muted"
              style={{
                marginTop: 4,
                fontSize: 12,
              }}
            >
              Status changes follow the backend
              event lifecycle rules.
            </div>
          </div>

          <div
            style={{
              padding: 16,
              display: "grid",
              gap: 10,
            }}
          >
            {filteredEvents
              .filter(
                (event) =>
                  event.status !==
                    EVENT_STATUS.COMPLETED &&
                  event.status !==
                    EVENT_STATUS.CANCELLED
              )
              .slice(0, 10)
              .map((event) => {
                const eventId =
                  event._id ||
                  event.id;

                const isBusy =
                  actionId === eventId;

                return (
                  <div
                    key={eventId}
                    className="row-between"
                    style={{
                      borderBottom:
                        "1px solid #edf0f4",
                      paddingBottom: 10,
                    }}
                  >
                    <div>
                      <strong>
                        {event.name}
                      </strong>

                      <div className="muted">
                        {event.eventCode}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 7,
                        flexWrap:
                          "wrap",
                        justifyContent:
                          "flex-end",
                      }}
                    >
                      {event.status ===
                        EVENT_STATUS.UPCOMING && (
                        <>
                          <button
                            className="btn secondary"
                            onClick={() =>
                              handleStatusChange(
                                event,
                                EVENT_STATUS.ONGOING
                              )
                            }
                            disabled={
                              isBusy
                            }
                          >
                            Start Event
                          </button>

                          <button
                            className="btn danger"
                            onClick={() =>
                              handleStatusChange(
                                event,
                                EVENT_STATUS.CANCELLED
                              )
                            }
                            disabled={
                              isBusy
                            }
                          >
                            Cancel
                          </button>
                        </>
                      )}

                      {event.status ===
                        EVENT_STATUS.ONGOING && (
                        <>
                          <button
                            className="btn secondary"
                            onClick={() =>
                              handleStatusChange(
                                event,
                                EVENT_STATUS.COMPLETED
                              )
                            }
                            disabled={
                              isBusy
                            }
                          >
                            Complete
                          </button>

                          <button
                            className="btn danger"
                            onClick={() =>
                              handleStatusChange(
                                event,
                                EVENT_STATUS.CANCELLED
                              )
                            }
                            disabled={
                              isBusy
                            }
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {showModal && (
        <div className="overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  EVENT MANAGEMENT
                </div>

                <h2>
                  {editingEvent
                    ? "Edit Event"
                    : "Create Event"}
                </h2>
              </div>

              <button
                className="icon-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="client-form"
              onSubmit={handleSubmit}
            >
              <div className="form-section-title">
                Event Information
              </div>

              <div className="form-grid">
                <label>
                  Event Code *
                  <input
                    name="eventCode"
                    value={
                      form.eventCode
                    }
                    onChange={
                      handleChange
                    }
                    placeholder="EVT-001"
                    maxLength={50}
                  />
                </label>

                <label>
                  Event Name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={
                      handleChange
                    }
                    placeholder="Annual Corporate Event"
                    maxLength={150}
                  />
                </label>

                <label>
                  Client *
                  <select
                    name="client"
                    value={
                      form.client
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      loadingReferences
                    }
                  >
                    <option value="">
                      Select client
                    </option>

                    {clients.map(
                      (client) => (
                        <option
                          key={
                            client._id ||
                            client.id
                          }
                          value={
                            client._id ||
                            client.id
                          }
                        >
                          {
                            client.companyName
                          }
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Venue *
                  <select
                    name="venue"
                    value={
                      form.venue
                    }
                    onChange={
                      handleChange
                    }
                    disabled={
                      loadingReferences
                    }
                  >
                    <option value="">
                      Select venue
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={
                            location._id ||
                            location.id
                          }
                          value={
                            location._id ||
                            location.id
                          }
                        >
                          {location.name}
                          {location.city
                            ? ` — ${location.city}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Start Date *
                  <input
                    type="date"
                    name="startDate"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>

                <label>
                  End Date *
                  <input
                    type="date"
                    name="endDate"
                    value={
                      form.endDate
                    }
                    onChange={
                      handleChange
                    }
                  />
                </label>

                <label className="full-width">
                  Description
                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    rows="4"
                    placeholder="Describe the event..."
                    maxLength={500}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={
                    closeModal
                  }
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn primary"
                  disabled={
                    saving ||
                    loadingReferences
                  }
                >
                  <Save size={16} />

                  {saving
                    ? "Saving..."
                    : editingEvent
                    ? "Update Event"
                    : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails &&
        viewingEvent && (
          <div className="overlay">
            <div className="modal">
              <div className="modal-header">
                <div>
                  <div className="eyebrow">
                    EVENT DETAILS
                  </div>

                  <h2>
                    {viewingEvent.name}
                  </h2>
                </div>

                <button
                  className="icon-button"
                  onClick={
                    closeDetails
                  }
                >
                  <X size={20} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 18,
                }}
              >
                <div
                  className="panel"
                  style={{
                    padding: 16,
                  }}
                >
                  <div className="eyebrow">
                    EVENT CODE
                  </div>

                  <strong>
                    {viewingEvent.eventCode ||
                      "—"}
                  </strong>
                </div>

                <div className="form-grid">
                  <div>
                    <div className="eyebrow">
                      CLIENT
                    </div>

                    <strong>
                      {getClientName(
                        viewingEvent
                      )}
                    </strong>
                  </div>

                  <div>
                    <div className="eyebrow">
                      VENUE
                    </div>

                    <strong>
                      {getVenueName(
                        viewingEvent
                      )}
                    </strong>

                    {getVenueLocation(
                      viewingEvent
                    ) && (
                      <div className="muted">
                        {getVenueLocation(
                          viewingEvent
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="eyebrow">
                      START DATE
                    </div>

                    <strong>
                      {formatDate(
                        viewingEvent.startDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <div className="eyebrow">
                      END DATE
                    </div>

                    <strong>
                      {formatDate(
                        viewingEvent.endDate
                      )}
                    </strong>
                  </div>

                  <div>
                    <div className="eyebrow">
                      STATUS
                    </div>

                    <span
                      className={`pill ${getStatusClass(
                        viewingEvent.status
                      )}`}
                    >
                      {getStatusIcon(
                        viewingEvent.status
                      )}

                      {viewingEvent.status ||
                        "UNKNOWN"}
                    </span>
                  </div>

                  <div>
                    <div className="eyebrow">
                      CREATED
                    </div>

                    <strong>
                      {formatDateTime(
                        viewingEvent.createdAt
                      )}
                    </strong>
                  </div>
                </div>

                {viewingEvent.description && (
                  <div>
                    <div className="eyebrow">
                      DESCRIPTION
                    </div>

                    <p className="muted">
                      {
                        viewingEvent.description
                      }
                    </p>
                  </div>
                )}

                <div className="modal-actions">
                  <button
                    className="btn secondary"
                    onClick={
                      closeDetails
                    }
                  >
                    Close
                  </button>

                  <button
                    className="btn primary"
                    onClick={() => {
                      closeDetails();
                      openEditModal(
                        viewingEvent
                      );
                    }}
                  >
                    <Pencil size={16} />
                    Edit Event
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
