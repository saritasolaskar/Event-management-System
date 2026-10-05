import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../auth/AuthContext";

import {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
} from "../../api/event.api";

import { getClients } from "../../api/client.api";

import {
  getLocations,
  createLocation,
} from "../../api/location.api";

import "../../styles/event-management.css";

const EVENT_STATUS = {
  UPCOMING: "UPCOMING",
  ONGOING: "ONGOING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

const MUTATION_ROLES = [
  "ADMIN",
  "OPERATIONS_MANAGER",
];

const emptyForm = {
  eventCode: "",
  name: "",
  client: "",
  venue: "",
  startDate: "",
  endDate: "",
  description: "",
};

const emptyLocationForm = {
  locationCode: "",
  name: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  latitude: "",
  longitude: "",
  landmark: "",
};

function unwrapResponse(response) {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "-";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toInputDateTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();

  const localDate = new Date(
    date.getTime() - offset * 60 * 1000
  );

  return localDate.toISOString().slice(0, 16);
}

function getStatusClass(status) {
  return `event-status event-status--${String(
    status || ""
  ).toLowerCase()}`;
}

function getClientName(event) {
  if (event?.client?.companyName) {
    return event.client.companyName;
  }

  if (event?.client?.name) {
    return event.client.name;
  }

  return event?.client?._id || event?.client || "-";
}

function getVenueName(event) {
  if (event?.venue?.name) {
    return event.venue.name;
  }

  return event?.venue?._id || event?.venue || "-";
}

function EventManagement() {
  const { user } = useAuth();

  const canMutate = MUTATION_ROLES.includes(user?.role);
  const canDelete = user?.role === "ADMIN";

  const [events, setEvents] = useState([]);
  const [clients, setClients] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [showLocationForm, setShowLocationForm] =
    useState(false);

  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [locationForm, setLocationForm] =
    useState(emptyLocationForm);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        eventsResponse,
        clientsResponse,
        locationsResponse,
      ] = await Promise.all([
        getEvents(),
        getClients(),
        getLocations(),
      ]);

      const eventsData =
        unwrapResponse(eventsResponse);

      const clientsData =
        unwrapResponse(clientsResponse);

      const locationsData =
        unwrapResponse(locationsResponse);

      setEvents(
        Array.isArray(eventsData)
          ? eventsData
          : []
      );

      setClients(
        Array.isArray(clientsData)
          ? clientsData
          : []
      );

      setLocations(
        Array.isArray(locationsData)
          ? locationsData
          : []
      );
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load event data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return events.filter((event) => {
      const matchesSearch =
        !query ||
        event?.eventCode
          ?.toLowerCase()
          .includes(query) ||
        event?.name
          ?.toLowerCase()
          .includes(query) ||
        getClientName(event)
          .toLowerCase()
          .includes(query) ||
        getVenueName(event)
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        event?.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [events, search, statusFilter]);

  const statistics = useMemo(() => {
    return {
      total: events.length,

      upcoming: events.filter(
        (event) =>
          event.status ===
          EVENT_STATUS.UPCOMING
      ).length,

      ongoing: events.filter(
        (event) =>
          event.status ===
          EVENT_STATUS.ONGOING
      ).length,

      completed: events.filter(
        (event) =>
          event.status ===
          EVENT_STATUS.COMPLETED
      ).length,

      cancelled: events.filter(
        (event) =>
          event.status ===
          EVENT_STATUS.CANCELLED
      ).length,
    };
  }, [events]);

  const openCreateForm = () => {
    setEditingEvent(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (event) => {
    setEditingEvent(event);

    setForm({
      eventCode: event?.eventCode || "",

      name: event?.name || "",

      client:
        event?.client?._id ||
        event?.client ||
        "",

      venue:
        event?.venue?._id ||
        event?.venue ||
        "",

      startDate: toInputDateTime(
        event?.startDate
      ),

      endDate: toInputDateTime(
        event?.endDate
      ),

      description:
        event?.description || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingEvent(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
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

    const start = new Date(
      form.startDate
    );

    const end = new Date(
      form.endDate
    );

    if (Number.isNaN(start.getTime())) {
      return "Invalid start date.";
    }

    if (Number.isNaN(end.getTime())) {
      return "Invalid end date.";
    }

    if (start > end) {
      return "Start date cannot be greater than end date.";
    }

    if (form.eventCode.trim().length > 50) {
      return "Event code cannot exceed 50 characters.";
    }

    if (form.name.trim().length > 150) {
      return "Event name cannot exceed 150 characters.";
    }

    if (form.description.length > 500) {
      return "Description cannot exceed 500 characters.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const payload = {
      eventCode:
        form.eventCode.trim(),

      name:
        form.name.trim(),

      client:
        form.client,

      venue:
        form.venue,

      startDate:
        new Date(
          form.startDate
        ).toISOString(),

      endDate:
        new Date(
          form.endDate
        ).toISOString(),

      description:
        form.description.trim(),
    };

    try {
      if (editingEvent) {
        await updateEvent(
          editingEvent._id,
          payload
        );

        setSuccess(
          "Event updated successfully."
        );
      } else {
        await createEvent(payload);

        setSuccess(
          "Event created successfully."
        );
      }

      closeForm();

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save event."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * ==========================================
   * VENUE CREATION
   * ==========================================
   */

  const openLocationForm = () => {
    setLocationForm(
      emptyLocationForm
    );

    setError("");
    setSuccess("");
    setShowLocationForm(true);
  };

  const closeLocationForm = () => {
    if (locationSaving) {
      return;
    }

    setShowLocationForm(false);
    setLocationForm(
      emptyLocationForm
    );
  };

  const handleLocationChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    setLocationForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  };

  const validateLocationForm =
    () => {
      if (
        !locationForm.locationCode.trim()
      ) {
        return "Location code is required.";
      }

      if (
        !locationForm.name.trim()
      ) {
        return "Venue name is required.";
      }

      if (
        !locationForm.address.trim()
      ) {
        return "Address is required.";
      }

      if (
        !locationForm.city.trim()
      ) {
        return "City is required.";
      }

      if (
        !locationForm.state.trim()
      ) {
        return "State is required.";
      }

      if (
        locationForm.latitude.trim() &&
        Number.isNaN(
          Number(locationForm.latitude)
        )
      ) {
        return "Latitude must be a valid number.";
      }

      if (
        locationForm.longitude.trim() &&
        Number.isNaN(
          Number(locationForm.longitude)
        )
      ) {
        return "Longitude must be a valid number.";
      }

      return "";
    };

  const handleLocationSubmit =
    async (event) => {
      event.preventDefault();

      setError("");
      setSuccess("");

      const validationError =
        validateLocationForm();

      if (validationError) {
        setError(validationError);
        return;
      }

      setLocationSaving(true);

      const payload = {
        locationCode:
          locationForm.locationCode.trim(),

        name:
          locationForm.name.trim(),

        address:
          locationForm.address.trim(),

        city:
          locationForm.city.trim(),

        state:
          locationForm.state.trim(),

        country:
          locationForm.country.trim() ||
          "India",

        pincode:
          locationForm.pincode.trim(),

        landmark:
          locationForm.landmark.trim(),
      };

      if (
        locationForm.latitude.trim()
      ) {
        payload.latitude = Number(
          locationForm.latitude
        );
      }

      if (
        locationForm.longitude.trim()
      ) {
        payload.longitude = Number(
          locationForm.longitude
        );
      }

      try {
        const response =
          await createLocation(
            payload
          );

        const createdLocation =
          unwrapResponse(response);

        let venueId =
          createdLocation?._id;

        /*
         * Normally the API returns
         * the created location.
         *
         * If it doesn't, refresh locations
         * and find the newly created code.
         */
        if (!venueId) {
          const refreshResponse =
            await getLocations();

          const refreshedLocations =
            unwrapResponse(
              refreshResponse
            );

          if (
            Array.isArray(
              refreshedLocations
            )
          ) {
            setLocations(
              refreshedLocations
            );

            const matchingLocation =
              refreshedLocations.find(
                (location) =>
                  location.locationCode ===
                  payload.locationCode.toUpperCase()
              );

            venueId =
              matchingLocation?._id;
          }
        } else {
          setLocations(
            (previous) => [
              ...previous,
              createdLocation,
            ]
          );
        }

        /*
         * Automatically select the newly
         * created venue in the event form.
         */
        if (venueId) {
          setForm(
            (previous) => ({
              ...previous,
              venue: venueId,
            })
          );
        }

        setShowLocationForm(false);

        setLocationForm(
          emptyLocationForm
        );

        setSuccess(
          createdLocation?.name
            ? `Venue "${createdLocation.name}" created and selected.`
            : "Venue created and selected."
        );
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Unable to create venue."
        );
      } finally {
        setLocationSaving(false);
      }
    };

  const handleStatusChange = async (
    event,
    nextStatus
  ) => {
    setError("");
    setSuccess("");

    try {
      await updateEventStatus(
        event._id,
        nextStatus
      );

      setSuccess(
        `Event status changed to ${nextStatus}.`
      );

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update event status."
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await deleteEvent(
        deleteTarget._id
      );

      setSuccess(
        "Event deleted successfully."
      );

      setDeleteTarget(null);

      if (
        selectedEvent?._id ===
        deleteTarget._id
      ) {
        setSelectedEvent(null);
      }

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete event."
      );
    } finally {
      setSaving(false);
    }
  };

  const getAvailableStatusActions =
    (event) => {
      if (
        !canMutate ||
        !event?.status
      ) {
        return [];
      }

      if (
        event.status ===
        EVENT_STATUS.UPCOMING
      ) {
        return [
          EVENT_STATUS.ONGOING,
          EVENT_STATUS.CANCELLED,
        ];
      }

      if (
        event.status ===
        EVENT_STATUS.ONGOING
      ) {
        return [
          EVENT_STATUS.COMPLETED,
          EVENT_STATUS.CANCELLED,
        ];
      }

      return [];
    };

  return (
    <div className="event-page">

      {/* ================= HEADER ================= */}

      <div className="event-page__header">
        <div>
          <p className="event-page__eyebrow">
            Operations
          </p>

          <h1>
            Event Management
          </h1>

          <p>
            Manage event schedules,
            clients, venues and
            operational status.
          </p>
        </div>

        {canMutate && (
          <button
            className="event-btn event-btn--primary"
            onClick={openCreateForm}
          >
            + Create Event
          </button>
        )}
      </div>

      {/* ================= ALERTS ================= */}

      {error && (
        <div className="event-alert event-alert--error">
          {error}
        </div>
      )}

      {success && (
        <div className="event-alert event-alert--success">
          {success}
        </div>
      )}

      {/* ================= STATISTICS ================= */}

      <section className="event-stats">

        <div className="event-stat-card">
          <span>
            Total Events
          </span>

          <strong>
            {statistics.total}
          </strong>
        </div>

        <div className="event-stat-card">
          <span>
            Upcoming
          </span>

          <strong>
            {statistics.upcoming}
          </strong>
        </div>

        <div className="event-stat-card">
          <span>
            Ongoing
          </span>

          <strong>
            {statistics.ongoing}
          </strong>
        </div>

        <div className="event-stat-card">
          <span>
            Completed
          </span>

          <strong>
            {statistics.completed}
          </strong>
        </div>

        <div className="event-stat-card">
          <span>
            Cancelled
          </span>

          <strong>
            {statistics.cancelled}
          </strong>
        </div>

      </section>

      {/* ================= EVENT TABLE ================= */}

      <section className="event-panel">

        <div className="event-toolbar">

          <input
            type="search"
            placeholder="Search event, code, client or venue..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            className="event-search"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="event-filter"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="UPCOMING">
              Upcoming
            </option>

            <option value="ONGOING">
              Ongoing
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>
          </select>

          <button
            className="event-btn event-btn--secondary"
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </button>

        </div>

        {loading ? (
          <div className="event-empty">
            Loading events...
          </div>
        ) : filteredEvents.length ===
          0 ? (
          <div className="event-empty">

            <strong>
              No events found
            </strong>

            <span>
              Create an event or change
              your search/filter.
            </span>

          </div>
        ) : (
          <div className="event-table-wrapper">

            <table className="event-table">

              <thead>
                <tr>
                  <th>
                    Event
                  </th>

                  <th>
                    Client
                  </th>

                  <th>
                    Venue
                  </th>

                  <th>
                    Schedule
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredEvents.map(
                  (event) => {

                    const statusActions =
                      getAvailableStatusActions(
                        event
                      );

                    return (
                      <tr
                        key={
                          event._id
                        }
                      >

                        <td>
                          <div className="event-name-cell">

                            <strong>
                              {event.name}
                            </strong>

                            <span>
                              {event.eventCode}
                            </span>

                          </div>
                        </td>

                        <td>
                          {getClientName(
                            event
                          )}
                        </td>

                        <td>
                          {getVenueName(
                            event
                          )}
                        </td>

                        <td>
                          <div className="event-date-cell">

                            <span>
                              {formatDate(
                                event.startDate
                              )}
                            </span>

                            <small>
                              to{" "}
                              {formatDate(
                                event.endDate
                              )}
                            </small>

                          </div>
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              event.status
                            )}
                          >
                            {event.status}
                          </span>
                        </td>

                        <td>

                          <div className="event-actions">

                            <button
                              className="event-action"
                              onClick={() =>
                                setSelectedEvent(
                                  event
                                )
                              }
                            >
                              View
                            </button>

                            {canMutate && (
                              <button
                                className="event-action"
                                onClick={() =>
                                  openEditForm(
                                    event
                                  )
                                }
                              >
                                Edit
                              </button>
                            )}

                            {statusActions.length >
                              0 && (
                              <select
                                className="event-status-select"
                                value=""
                                onChange={(e) => {
                                  if (
                                    e.target
                                      .value
                                  ) {
                                    handleStatusChange(
                                      event,
                                      e.target
                                        .value
                                    );
                                  }
                                }}
                              >
                                <option value="">
                                  Change status
                                </option>

                                {statusActions.map(
                                  (
                                    status
                                  ) => (
                                    <option
                                      key={
                                        status
                                      }
                                      value={
                                        status
                                      }
                                    >
                                      {status}
                                    </option>
                                  )
                                )}
                              </select>
                            )}

                            {canDelete && (
                              <button
                                className="event-action event-action--danger"
                                onClick={() =>
                                  setDeleteTarget(
                                    event
                                  )
                                }
                              >
                                Delete
                              </button>
                            )}

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

      {/* =====================================================
          CREATE / EDIT EVENT MODAL
          ===================================================== */}

      {showForm && (
        <div className="event-modal-backdrop">

          <div className="event-modal">

            <div className="event-modal__header">

              <div>

                <h2>
                  {editingEvent
                    ? "Edit Event"
                    : "Create Event"}
                </h2>

                <p>
                  {editingEvent
                    ? "Update event information."
                    : "Create a new upcoming event."}
                </p>

              </div>

              <button
                className="event-modal__close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              className="event-form"
              onSubmit={handleSubmit}
            >

              <div className="event-form-grid">

                {/* EVENT CODE */}

                <label>
                  Event Code

                  <input
                    name="eventCode"
                    value={
                      form.eventCode
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={50}
                    required
                    disabled={
                      saving ||
                      Boolean(
                        editingEvent &&
                          editingEvent.status !==
                            EVENT_STATUS.UPCOMING
                      )
                    }
                  />
                </label>

                {/* EVENT NAME */}

                <label>
                  Event Name

                  <input
                    name="name"
                    value={
                      form.name
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={150}
                    required
                    disabled={
                      saving
                    }
                  />
                </label>

                {/* CLIENT */}

                <label>
                  Client

                  <select
                    name="client"
                    value={
                      form.client
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      saving ||
                      Boolean(
                        editingEvent &&
                          editingEvent.status !==
                            EVENT_STATUS.UPCOMING
                      )
                    }
                  >

                    <option value="">
                      Select client
                    </option>

                    {clients.map(
                      (client) => (
                        <option
                          key={
                            client._id
                          }
                          value={
                            client._id
                          }
                        >
                          {client.companyName ||
                            client.name ||
                            client.email ||
                            client._id}
                        </option>
                      )
                    )}

                  </select>
                </label>

                {/* VENUE */}

                <label>
                  Venue

                  <select
                    name="venue"
                    value={
                      form.venue
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      saving ||
                      Boolean(
                        editingEvent &&
                          editingEvent.status !==
                            EVENT_STATUS.UPCOMING
                      )
                    }
                  >

                    <option value="">
                      Select venue
                    </option>

                    {locations.map(
                      (location) => (
                        <option
                          key={
                            location._id
                          }
                          value={
                            location._id
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

                {/* ADD VENUE */}

                {!editingEvent &&
                  canMutate && (
                    <div className="event-form-field--full">

                      <button
                        type="button"
                        className="event-btn event-btn--secondary"
                        onClick={
                          openLocationForm
                        }
                        disabled={
                          saving ||
                          locationSaving
                        }
                      >
                        + Add New Venue
                      </button>

                      <small>
                        Can't find the venue?
                        Create it here.
                      </small>

                    </div>
                  )}

                {/* START DATE */}

                <label>
                  Start Date & Time

                  <input
                    type="datetime-local"
                    name="startDate"
                    value={
                      form.startDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      saving ||
                      Boolean(
                        editingEvent &&
                          editingEvent.status !==
                            EVENT_STATUS.UPCOMING
                      )
                    }
                  />
                </label>

                {/* END DATE */}

                <label>
                  End Date & Time

                  <input
                    type="datetime-local"
                    name="endDate"
                    value={
                      form.endDate
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={
                      saving ||
                      Boolean(
                        editingEvent &&
                          editingEvent.status !==
                            EVENT_STATUS.UPCOMING
                      )
                    }
                  />
                </label>

                {/* DESCRIPTION */}

                <label className="event-form-field--full">

                  Description

                  <textarea
                    name="description"
                    value={
                      form.description
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={500}
                    rows={4}
                    disabled={
                      saving
                    }
                  />

                  <small>
                    {
                      form.description
                        .length
                    }
                    /500
                  </small>

                </label>

              </div>

              <div className="event-modal__footer">

                <button
                  type="button"
                  className="event-btn event-btn--secondary"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="event-btn event-btn--primary"
                  disabled={
                    saving
                  }
                >
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

      {/* =====================================================
          ADD VENUE MODAL
          ===================================================== */}

      {showLocationForm && (
        <div className="event-modal-backdrop">

          <div className="event-modal">

            <div className="event-modal__header">

              <div>

                <p className="event-page__eyebrow">
                  Venue Setup
                </p>

                <h2>
                  Add New Venue
                </h2>

                <p>
                  Create the venue once and
                  use it for this event.
                </p>

              </div>

              <button
                className="event-modal__close"
                onClick={
                  closeLocationForm
                }
                disabled={
                  locationSaving
                }
              >
                ×
              </button>

            </div>

            <form
              className="event-form"
              onSubmit={
                handleLocationSubmit
              }
            >

              <div className="event-form-grid">

                {/* LOCATION CODE */}

                <label>
                  Location Code

                  <input
                    name="locationCode"
                    value={
                      locationForm.locationCode
                    }
                    onChange={
                      handleLocationChange
                    }
                    maxLength={50}
                    placeholder="e.g. PUNE001"
                    required
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* VENUE NAME */}

                <label>
                  Venue Name

                  <input
                    name="name"
                    value={
                      locationForm.name
                    }
                    onChange={
                      handleLocationChange
                    }
                    placeholder="e.g. Pune Convention Centre"
                    required
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* ADDRESS */}

                <label className="event-form-field--full">
                  Address

                  <input
                    name="address"
                    value={
                      locationForm.address
                    }
                    onChange={
                      handleLocationChange
                    }
                    required
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* CITY */}

                <label>
                  City

                  <input
                    name="city"
                    value={
                      locationForm.city
                    }
                    onChange={
                      handleLocationChange
                    }
                    required
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* STATE */}

                <label>
                  State

                  <input
                    name="state"
                    value={
                      locationForm.state
                    }
                    onChange={
                      handleLocationChange
                    }
                    required
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* COUNTRY */}

                <label>
                  Country

                  <input
                    name="country"
                    value={
                      locationForm.country
                    }
                    onChange={
                      handleLocationChange
                    }
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* PINCODE */}

                <label>
                  Pincode

                  <input
                    name="pincode"
                    value={
                      locationForm.pincode
                    }
                    onChange={
                      handleLocationChange
                    }
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* LATITUDE */}

                <label>
                  Latitude

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={
                      locationForm.latitude
                    }
                    onChange={
                      handleLocationChange
                    }
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* LONGITUDE */}

                <label>
                  Longitude

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={
                      locationForm.longitude
                    }
                    onChange={
                      handleLocationChange
                    }
                    disabled={
                      locationSaving
                    }
                  />
                </label>

                {/* LANDMARK */}

                <label className="event-form-field--full">

                  Landmark

                  <input
                    name="landmark"
                    value={
                      locationForm.landmark
                    }
                    onChange={
                      handleLocationChange
                    }
                    disabled={
                      locationSaving
                    }
                  />

                </label>

              </div>

              <div className="event-modal__footer">

                <button
                  type="button"
                  className="event-btn event-btn--secondary"
                  onClick={
                    closeLocationForm
                  }
                  disabled={
                    locationSaving
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="event-btn event-btn--primary"
                  disabled={
                    locationSaving
                  }
                >
                  {locationSaving
                    ? "Creating..."
                    : "Create Venue"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* =====================================================
          EVENT DETAILS MODAL
          ===================================================== */}

      {selectedEvent && (
        <div className="event-modal-backdrop">

          <div className="event-modal event-modal--details">

            <div className="event-modal__header">

              <div>

                <p className="event-page__eyebrow">
                  Event Details
                </p>

                <h2>
                  {selectedEvent.name}
                </h2>

              </div>

              <button
                className="event-modal__close"
                onClick={() =>
                  setSelectedEvent(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="event-details">

              <div>
                <span>
                  Event Code
                </span>

                <strong>
                  {
                    selectedEvent.eventCode
                  }
                </strong>
              </div>

              <div>
                <span>
                  Client
                </span>

                <strong>
                  {getClientName(
                    selectedEvent
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Venue
                </span>

                <strong>
                  {getVenueName(
                    selectedEvent
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Start
                </span>

                <strong>
                  {formatDate(
                    selectedEvent.startDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  End
                </span>

                <strong>
                  {formatDate(
                    selectedEvent.endDate
                  )}
                </strong>
              </div>

              <div>
                <span>
                  Status
                </span>

                <strong
                  className={getStatusClass(
                    selectedEvent.status
                  )}
                >
                  {
                    selectedEvent.status
                  }
                </strong>
              </div>

              <div className="event-details__description">

                <span>
                  Description
                </span>

                <p>
                  {
                    selectedEvent.description ||
                    "No description provided."
                  }
                </p>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* =====================================================
          DELETE CONFIRMATION
          ===================================================== */}

      {deleteTarget && (
        <div className="event-modal-backdrop">

          <div className="event-modal event-modal--small">

            <h2>
              Delete Event?
            </h2>

            <p>
              Are you sure you want to
              delete{" "}
              <strong>
                {deleteTarget.name}
              </strong>
              ?
            </p>

            <p className="event-warning">
              The backend will reject
              deletion if operational data
              already exists for this event.
            </p>

            <div className="event-modal__footer">

              <button
                className="event-btn event-btn--secondary"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={
                  saving
                }
              >
                Cancel
              </button>

              <button
                className="event-btn event-btn--danger"
                onClick={
                  handleDelete
                }
                disabled={
                  saving
                }
              >
                {saving
                  ? "Deleting..."
                  : "Delete Event"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default EventManagement;