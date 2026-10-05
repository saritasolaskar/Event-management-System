import React, { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
  Plane,
} from "lucide-react";

import api from "../../services/api";

const GUEST_STATUSES = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
};

const initialForm = {
  guestCode: "",
  event: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  gender: "",
  pickupLocation: "",
  dropLocation: "",
  hotelName: "",
  roomNumber: "",
  flightNumber: "",
  arrivalTime: "",
  departureTime: "",
  remarks: "",
};

function getArray(response) {
  if (Array.isArray(response)) return response;

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  if (Array.isArray(response?.data?.guests)) {
    return response.data.guests;
  }

  if (Array.isArray(response?.guests)) {
    return response.guests;
  }

  return [];
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    fallback
  );
}

function formatDate(value) {
  if (!value) return "—";

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
  if (!value) return "—";

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

function toInputDateTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 16);
}

function getGuestName(guest) {
  return [guest?.firstName, guest?.lastName]
    .filter(Boolean)
    .join(" ");
}

function getEventName(guest) {
  if (!guest?.event) return "—";

  if (typeof guest.event === "string") {
    return guest.event;
  }

  return (
    guest.event.name ||
    guest.event.eventCode ||
    "—"
  );
}

function getEventCode(guest) {
  if (!guest?.event) return "";

  if (typeof guest.event === "string") {
    return "";
  }

  return guest.event.eventCode || "";
}

function getLocationName(location) {
  if (!location) return "—";

  if (typeof location === "string") {
    return location;
  }

  return (
    location.name ||
    location.locationCode ||
    "—"
  );
}

function getLocationCity(location) {
  if (!location || typeof location === "string") {
    return "";
  }

  return location.city || "";
}

function getStatusClass(status) {
  switch (status) {
    case GUEST_STATUSES.CONFIRMED:
      return "success";

    case GUEST_STATUSES.CANCELLED:
      return "danger";

    case GUEST_STATUSES.PENDING:
    default:
      return "warning";
  }
}

function StatCard({
  icon,
  label,
  value,
  description,
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className="stat-icon">
          {icon}
        </div>

        <span className="stat-label">
          {label}
        </span>
      </div>

      <div className="stat-value">
        {value}
      </div>

      {description && (
        <div className="muted">
          {description}
        </div>
      )}
    </div>
  );
}

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [eventFilter, setEventFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [editingGuest, setEditingGuest] = useState(null);
  const [selectedGuest, setSelectedGuest] = useState(null);

  const [form, setForm] = useState(initialForm);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        guestsResponse,
        eventsResponse,
        locationsResponse,
      ] = await Promise.all([
        api.request("/guests"),
        api.request("/events"),
        api.request("/locations"),
      ]);

      setGuests(getArray(guestsResponse));
      setEvents(getArray(eventsResponse));
      setLocations(getArray(locationsResponse));
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to load guest data."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const upcomingEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.status === "UPCOMING" &&
        !event.isDeleted
    );
  }, [events]);

  const stats = useMemo(() => {
    const total = guests.length;

    const pending = guests.filter(
      (guest) =>
        guest.status === GUEST_STATUSES.PENDING
    ).length;

    const confirmed = guests.filter(
      (guest) =>
        guest.status === GUEST_STATUSES.CONFIRMED
    ).length;

    const cancelled = guests.filter(
      (guest) =>
        guest.status === GUEST_STATUSES.CANCELLED
    ).length;

    return {
      total,
      pending,
      confirmed,
      cancelled,
    };
  }, [guests]);

  const filteredGuests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return guests.filter((guest) => {
      const guestName =
        getGuestName(guest).toLowerCase();

      const guestCode =
        String(guest.guestCode || "").toLowerCase();

      const phone =
        String(guest.phone || "").toLowerCase();

      const email =
        String(guest.email || "").toLowerCase();

      const eventName =
        getEventName(guest).toLowerCase();

      const matchesSearch =
        !query ||
        guestName.includes(query) ||
        guestCode.includes(query) ||
        phone.includes(query) ||
        email.includes(query) ||
        eventName.includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        guest.status === statusFilter;

      const guestEventId =
        typeof guest.event === "string"
          ? guest.event
          : guest.event?._id;

      const matchesEvent =
        eventFilter === "ALL" ||
        guestEventId === eventFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesEvent
      );
    });
  }, [
    guests,
    search,
    statusFilter,
    eventFilter,
  ]);

  const handleFormChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingGuest(null);
    setForm(initialForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (guest) => {
    const eventId =
      typeof guest.event === "string"
        ? guest.event
        : guest.event?._id || "";

    const pickupLocationId =
      typeof guest.pickupLocation === "string"
        ? guest.pickupLocation
        : guest.pickupLocation?._id || "";

    const dropLocationId =
      typeof guest.dropLocation === "string"
        ? guest.dropLocation
        : guest.dropLocation?._id || "";

    setEditingGuest(guest);

    setForm({
      guestCode: guest.guestCode || "",
      event: eventId,
      firstName: guest.firstName || "",
      lastName: guest.lastName || "",
      email: guest.email || "",
      phone: guest.phone || "",
      gender: guest.gender || "",
      pickupLocation: pickupLocationId,
      dropLocation: dropLocationId,
      hotelName: guest.hotelName || "",
      roomNumber: guest.roomNumber || "",
      flightNumber: guest.flightNumber || "",
      arrivalTime: toInputDateTime(
        guest.arrivalTime
      ),
      departureTime: toInputDateTime(
        guest.departureTime
      ),
      remarks: guest.remarks || "",
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingGuest(null);
    setForm(initialForm);
  };

  const openDetails = (guest) => {
    setSelectedGuest(guest);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedGuest(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.event) {
      setError("Please select an event.");
      return;
    }

    if (!form.pickupLocation) {
      setError("Please select a pickup location.");
      return;
    }

    if (!form.dropLocation) {
      setError("Please select a drop location.");
      return;
    }

    if (!form.firstName.trim()) {
      setError("First name is required.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    if (!editingGuest && !form.guestCode.trim()) {
      setError("Guest code is required.");
      return;
    }

    const selectedEvent = events.find(
      (eventItem) =>
        eventItem._id === form.event
    );

    if (
      selectedEvent &&
      selectedEvent.status !== "UPCOMING"
    ) {
      setError(
        "Guests can only be created or structurally modified for upcoming events."
      );
      return;
    }

    const payload = {
      event: form.event,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim(),
      gender: form.gender || undefined,
      pickupLocation: form.pickupLocation,
      dropLocation: form.dropLocation,
      hotelName:
        form.hotelName.trim() || undefined,
      roomNumber:
        form.roomNumber.trim() || undefined,
      flightNumber:
        form.flightNumber.trim() || undefined,
      arrivalTime:
        form.arrivalTime
          ? new Date(form.arrivalTime).toISOString()
          : undefined,
      departureTime:
        form.departureTime
          ? new Date(form.departureTime).toISOString()
          : undefined,
      remarks:
        form.remarks.trim() || undefined,
    };

    if (!editingGuest) {
      payload.guestCode =
        form.guestCode.trim();
    }

    setSaving(true);

    try {
      if (editingGuest) {
        await api.request(
          `/guests/${editingGuest._id}`,
          {
            method: "PUT",
            body: payload,
          }
        );

        setSuccess(
          "Guest updated successfully."
        );
      } else {
        await api.request("/guests", {
          method: "POST",
          body: payload,
        });

        setSuccess(
          "Guest created successfully."
        );
      }

      setShowModal(false);
      setEditingGuest(null);
      setForm(initialForm);

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          editingGuest
            ? "Unable to update guest."
            : "Unable to create guest."
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (guest) => {
    const name =
      getGuestName(guest) ||
      guest.guestCode ||
      "this guest";

    const confirmed = window.confirm(
      `Delete ${name}? This will soft-delete the guest from the active guest list.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await api.request(
        `/guests/${guest._id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        "Guest deleted successfully."
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to delete guest."
        )
      );
    }
  };

  const handleStatusChange = async (
    guest,
    status
  ) => {
    if (guest.status === status) return;

    setError("");
    setSuccess("");

    try {
      await api.request(
        `/guests/${guest._id}/status`,
        {
          method: "PATCH",
          body: { status },
        }
      );

      setSuccess(
        `Guest status changed to ${status}.`
      );

      await loadData();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Unable to change guest status."
        )
      );
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            ADMINISTRATION
          </div>

          <h1>Guests</h1>

          <p className="muted">
            Manage event guests, travel details,
            pickup and drop locations.
          </p>
        </div>

        <div className="hero-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openCreateModal}
          >
            <Plus size={17} />
            Add Guest
          </button>
        </div>
      </div>

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

      <div className="stats-grid">
        <StatCard
          icon={<Users size={19} />}
          label="Total Guests"
          value={stats.total}
          description="Active guest records"
        />

        <StatCard
          icon={<Clock3 size={19} />}
          label="Pending"
          value={stats.pending}
          description="Awaiting confirmation"
        />

        <StatCard
          icon={<CheckCircle2 size={19} />}
          label="Confirmed"
          value={stats.confirmed}
          description="Confirmed guests"
        />

        <StatCard
          icon={<X size={19} />}
          label="Cancelled"
          value={stats.cancelled}
          description="Cancelled guests"
        />
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search guest, code, phone or event..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            value={eventFilter}
            onChange={(event) =>
              setEventFilter(event.target.value)
            }
            className="filter-select"
          >
            <option value="ALL">
              All Events
            </option>

            {events.map((event) => (
              <option
                key={event._id}
                value={event._id}
              >
                {event.eventCode} — {event.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            className="filter-select"
          >
            <option value="ALL">
              All Statuses
            </option>

            <option value="PENDING">
              Pending
            </option>

            <option value="CONFIRMED">
              Confirmed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw
              size={24}
              className="spin"
            />

            <p>Loading guests...</p>
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="empty-state">
            <Users size={34} />

            <h3>No guests found</h3>

            <p className="muted">
              Try changing the filters or add a
              new guest.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Event</th>
                  <th>Contact</th>
                  <th>Travel</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredGuests.map((guest) => (
                  <tr key={guest._id}>
                    <td>
                      <div className="event-row">
                        <div className="event-avatar">
                          <UserRound size={18} />
                        </div>

                        <div className="event-main">
                          <strong>
                            {getGuestName(guest) ||
                              "Unnamed Guest"}
                          </strong>

                          <span className="muted">
                            {guest.guestCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>
                          {getEventName(guest)}
                        </strong>

                        {getEventCode(guest) && (
                          <div className="muted">
                            {getEventCode(guest)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>
                          {guest.phone || "—"}
                        </strong>

                        {guest.email && (
                          <div className="muted">
                            {guest.email}
                          </div>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="travel-cell">
                        <span>
                          <MapPin size={14} />
                          {getLocationName(
                            guest.pickupLocation
                          )}
                        </span>

                        <span className="muted">
                          →{" "}
                          {getLocationName(
                            guest.dropLocation
                          )}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`status-badge ${getStatusClass(
                          guest.status
                        )}`}
                      >
                        {guest.status}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="View details"
                          onClick={() =>
                            openDetails(guest)
                          }
                        >
                          <Eye size={16} />
                        </button>

                        {guest.status !==
                          "CANCELLED" && (
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit guest"
                            onClick={() =>
                              openEditModal(guest)
                            }
                          >
                            <Pencil size={16} />
                          </button>
                        )}

                        {guest.status ===
                          "PENDING" && (
                          <button
                            type="button"
                            className="icon-button"
                            title="Confirm guest"
                            onClick={() =>
                              handleStatusChange(
                                guest,
                                "CONFIRMED"
                              )
                            }
                          >
                            <CheckCircle2
                              size={16}
                            />
                          </button>
                        )}

                        {guest.status !==
                          "CANCELLED" && (
                          <button
                            type="button"
                            className="icon-button danger"
                            title="Delete guest"
                            onClick={() =>
                              handleDelete(guest)
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span className="muted">
            Showing {filteredGuests.length} of{" "}
            {guests.length} guests
          </span>
        </div>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingGuest
                    ? "Edit Guest"
                    : "Add Guest"}
                </h2>

                <p className="muted">
                  {editingGuest
                    ? "Update guest information."
                    : "Create a new guest record."}
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={19} />
              </button>
            </div>

            <form
              className="client-form"
              onSubmit={handleSubmit}
            >
              <div className="form-section-title">
                Guest Information
              </div>

              <div className="form-grid">
                {!editingGuest && (
                  <label>
                    Guest Code *
                    <input
                      name="guestCode"
                      value={form.guestCode}
                      onChange={handleFormChange}
                      placeholder="GST-001"
                    />
                  </label>
                )}

                <label>
                  Event *
                  <select
                    name="event"
                    value={form.event}
                    onChange={handleFormChange}
                  >
                    <option value="">
                      Select upcoming event
                    </option>

                    {upcomingEvents.map(
                      (event) => (
                        <option
                          key={event._id}
                          value={event._id}
                        >
                          {event.eventCode} —{" "}
                          {event.name}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  First Name *
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleFormChange}
                    placeholder="First name"
                  />
                </label>

                <label>
                  Last Name
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleFormChange}
                    placeholder="Last name"
                  />
                </label>

                <label>
                  Phone *
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </label>

                <label>
                  Email
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="guest@example.com"
                  />
                </label>

                <label>
                  Gender
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleFormChange}
                  >
                    <option value="">
                      Select gender
                    </option>
                    <option value="MALE">
                      Male
                    </option>
                    <option value="FEMALE">
                      Female
                    </option>
                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </label>
              </div>

              <div className="form-section-title">
                Movement Details
              </div>

              <div className="form-grid">
                <label>
                  Pickup Location *
                  <select
                    name="pickupLocation"
                    value={form.pickupLocation}
                    onChange={handleFormChange}
                  >
                    <option value="">
                      Select pickup location
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={location._id}
                          value={location._id}
                        >
                          {location.name} —{" "}
                          {location.city}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Drop Location *
                  <select
                    name="dropLocation"
                    value={form.dropLocation}
                    onChange={handleFormChange}
                  >
                    <option value="">
                      Select drop location
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={location._id}
                          value={location._id}
                        >
                          {location.name} —{" "}
                          {location.city}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Hotel Name
                  <input
                    name="hotelName"
                    value={form.hotelName}
                    onChange={handleFormChange}
                    placeholder="Hotel name"
                  />
                </label>

                <label>
                  Room Number
                  <input
                    name="roomNumber"
                    value={form.roomNumber}
                    onChange={handleFormChange}
                    placeholder="Room number"
                  />
                </label>
              </div>

              <div className="form-section-title">
                Flight Details
              </div>

              <div className="form-grid">
                <label>
                  Flight Number
                  <input
                    name="flightNumber"
                    value={form.flightNumber}
                    onChange={handleFormChange}
                    placeholder="AI-123"
                  />
                </label>

                <label>
                  Arrival Time
                  <input
                    type="datetime-local"
                    name="arrivalTime"
                    value={form.arrivalTime}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Departure Time
                  <input
                    type="datetime-local"
                    name="departureTime"
                    value={form.departureTime}
                    onChange={handleFormChange}
                  />
                </label>

                <label className="full-width">
                  Remarks
                  <textarea
                    name="remarks"
                    value={form.remarks}
                    onChange={handleFormChange}
                    placeholder="Additional guest requirements..."
                    rows="4"
                    maxLength={500}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingGuest
                    ? "Update Guest"
                    : "Create Guest"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetails && selectedGuest && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  GUEST DETAILS
                </div>

                <h2>
                  {getGuestName(selectedGuest)}
                </h2>

                <p className="muted">
                  {selectedGuest.guestCode}
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeDetails}
              >
                <X size={19} />
              </button>
            </div>

            <div className="details-grid">
              <div className="detail-item">
                <span className="muted">
                  Status
                </span>

                <strong>
                  <span
                    className={`status-badge ${getStatusClass(
                      selectedGuest.status
                    )}`}
                  >
                    {selectedGuest.status}
                  </span>
                </strong>
              </div>

              <div className="detail-item">
                <span className="muted">
                  Event
                </span>

                <strong>
                  {getEventName(selectedGuest)}
                </strong>
              </div>

              <div className="detail-item">
                <span className="muted">
                  Phone
                </span>

                <strong>
                  {selectedGuest.phone || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span className="muted">
                  Email
                </span>

                <strong>
                  {selectedGuest.email || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span className="muted">
                  Gender
                </span>

                <strong>
                  {selectedGuest.gender || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span className="muted">
                  Hotel
                </span>

                <strong>
                  {selectedGuest.hotelName || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span className="muted">
                  Room Number
                </span>

                <strong>
                  {selectedGuest.roomNumber || "—"}
                </strong>
              </div>

              <div className="detail-item">
                <span className="muted">
                  Flight
                </span>

                <strong>
                  {selectedGuest.flightNumber || "—"}
                </strong>
              </div>
            </div>

            <div className="detail-section">
              <div className="form-section-title">
                Journey
              </div>

              <div className="journey-card">
                <div>
                  <MapPin size={17} />

                  <div>
                    <span className="muted">
                      Pickup
                    </span>

                    <strong>
                      {getLocationName(
                        selectedGuest.pickupLocation
                      )}
                    </strong>

                    {getLocationCity(
                      selectedGuest.pickupLocation
                    ) && (
                      <span className="muted">
                        {
                          getLocationCity(
                            selectedGuest.pickupLocation
                          )
                        }
                      </span>
                    )}
                  </div>
                </div>

                <div className="journey-arrow">
                  →
                </div>

                <div>
                  <MapPin size={17} />

                  <div>
                    <span className="muted">
                      Drop
                    </span>

                    <strong>
                      {getLocationName(
                        selectedGuest.dropLocation
                      )}
                    </strong>

                    {getLocationCity(
                      selectedGuest.dropLocation
                    ) && (
                      <span className="muted">
                        {
                          getLocationCity(
                            selectedGuest.dropLocation
                          )
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="form-section-title">
                Schedule
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="muted">
                    <CalendarDays size={14} />
                    Arrival
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedGuest.arrivalTime
                    )}
                  </strong>
                </div>

                <div className="detail-item">
                  <span className="muted">
                    <CalendarDays size={14} />
                    Departure
                  </span>

                  <strong>
                    {formatDateTime(
                      selectedGuest.departureTime
                    )}
                  </strong>
                </div>
              </div>
            </div>

            {selectedGuest.remarks && (
              <div className="detail-section">
                <div className="form-section-title">
                  Remarks
                </div>

                <p>
                  {selectedGuest.remarks}
                </p>
              </div>
            )}

            <div className="modal-actions">
              {selectedGuest.status ===
                "PENDING" && (
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => {
                    handleStatusChange(
                      selectedGuest,
                      "CONFIRMED"
                    );
                    closeDetails();
                  }}
                >
                  <CheckCircle2 size={16} />
                  Confirm Guest
                </button>
              )}

              {selectedGuest.status !==
                "CANCELLED" && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    closeDetails();
                    openEditModal(
                      selectedGuest
                    );
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </button>
              )}

              <button
                type="button"
                className="secondary-button"
                onClick={closeDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}