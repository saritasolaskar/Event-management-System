import { useEffect, useMemo, useState } from "react";

import {
  getGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  updateGuestStatus,
} from "../../api/guest.api";

import { getEvents } from "../../api/event.api";
import { getLocations } from "../../api/location.api";

import { useAuth } from "../../auth/AuthContext";

import "../../styles/guest-management.css";

const GUEST_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  CANCELLED: "CANCELLED",
};

const MUTATION_ROLES = [
  "ADMIN",
  "OPERATIONS_MANAGER",
];

const emptyForm = {
  guestCode: "",
  event: "",
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
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

function unwrapResponse(response) {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
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
  return `guest-status guest-status--${String(
    status || ""
  ).toLowerCase()}`;
}

function getEventName(guest) {
  if (guest?.event?.name) {
    return guest.event.name;
  }

  if (guest?.event?.eventCode) {
    return guest.event.eventCode;
  }

  return guest?.event?._id || guest?.event || "-";
}

function getLocationName(location) {
  if (location?.name) {
    return location.name;
  }

  return location?._id || location || "-";
}

function GuestManagement() {
  const { user } = useAuth();

  const canMutate = MUTATION_ROLES.includes(
    user?.role
  );

  const canDelete = user?.role === "ADMIN";

  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");
  const [eventFilter, setEventFilter] =
    useState("ALL");

  const [showForm, setShowForm] =
    useState(false);

  const [selectedGuest, setSelectedGuest] =
    useState(null);

  const [editingGuest, setEditingGuest] =
    useState(null);

  const [deleteTarget, setDeleteTarget] =
    useState(null);

  const [form, setForm] =
    useState(emptyForm);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        guestsResponse,
        eventsResponse,
        locationsResponse,
      ] = await Promise.all([
        getGuests(),
        getEvents(),
        getLocations(),
      ]);

      const guestsData =
        unwrapResponse(guestsResponse);

      const eventsData =
        unwrapResponse(eventsResponse);

      const locationsData =
        unwrapResponse(locationsResponse);

      setGuests(
        Array.isArray(guestsData)
          ? guestsData
          : []
      );

      setEvents(
        Array.isArray(eventsData)
          ? eventsData
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
          "Unable to load guest data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGuests = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return guests.filter((guest) => {
      const fullName = [
        guest?.firstName,
        guest?.lastName,
      ]
        .filter(Boolean)
        .join(" ");

      const matchesSearch =
        !query ||
        guest?.guestCode
          ?.toLowerCase()
          .includes(query) ||
        fullName
          .toLowerCase()
          .includes(query) ||
        guest?.phone
          ?.toLowerCase()
          .includes(query) ||
        guest?.email
          ?.toLowerCase()
          .includes(query) ||
        getEventName(guest)
          .toLowerCase()
          .includes(query) ||
        getLocationName(
          guest?.pickupLocation
        )
          .toLowerCase()
          .includes(query) ||
        getLocationName(
          guest?.dropLocation
        )
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        guest?.status === statusFilter;

      const guestEventId =
        guest?.event?._id ||
        guest?.event;

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

  const statistics = useMemo(() => {
    return {
      total: guests.length,

      pending: guests.filter(
        (guest) =>
          guest.status ===
          GUEST_STATUS.PENDING
      ).length,

      confirmed: guests.filter(
        (guest) =>
          guest.status ===
          GUEST_STATUS.CONFIRMED
      ).length,

      cancelled: guests.filter(
        (guest) =>
          guest.status ===
          GUEST_STATUS.CANCELLED
      ).length,
    };
  }, [guests]);

  const openCreateForm = () => {
    setEditingGuest(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (guest) => {
    setEditingGuest(guest);

    setForm({
      guestCode: guest?.guestCode || "",

      event:
        guest?.event?._id ||
        guest?.event ||
        "",

      firstName:
        guest?.firstName || "",

      lastName:
        guest?.lastName || "",

      phone:
        guest?.phone || "",

      email:
        guest?.email || "",

      gender:
        guest?.gender || "",

      pickupLocation:
        guest?.pickupLocation?._id ||
        guest?.pickupLocation ||
        "",

      dropLocation:
        guest?.dropLocation?._id ||
        guest?.dropLocation ||
        "",

      hotelName:
        guest?.hotelName || "",

      roomNumber:
        guest?.roomNumber || "",

      flightNumber:
        guest?.flightNumber || "",

      arrivalTime:
        toInputDateTime(
          guest?.arrivalTime
        ),

      departureTime:
        toInputDateTime(
          guest?.departureTime
        ),

      remarks:
        guest?.remarks || "",
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
    setEditingGuest(null);
    setForm(emptyForm);
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!form.guestCode.trim()) {
      return "Guest code is required.";
    }

    if (!form.event) {
      return "Please select an event.";
    }

    if (!form.firstName.trim()) {
      return "First name is required.";
    }

    if (!form.phone.trim()) {
      return "Phone number is required.";
    }

    if (!form.pickupLocation) {
      return "Pickup location is required.";
    }

    if (!form.dropLocation) {
      return "Drop location is required.";
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (
      form.arrivalTime &&
      form.departureTime
    ) {
      const arrival = new Date(
        form.arrivalTime
      );

      const departure = new Date(
        form.departureTime
      );

      if (
        !Number.isNaN(
          arrival.getTime()
        ) &&
        !Number.isNaN(
          departure.getTime()
        ) &&
        arrival > departure
      ) {
        return "Arrival time cannot be later than departure time.";
      }
    }

    if (form.remarks.length > 500) {
      return "Remarks cannot exceed 500 characters.";
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
      firstName:
        form.firstName.trim(),

      lastName:
        form.lastName.trim(),

      phone:
        form.phone.trim(),

      pickupLocation:
        form.pickupLocation,

      dropLocation:
        form.dropLocation,

      hotelName:
        form.hotelName.trim(),

      roomNumber:
        form.roomNumber.trim(),

      flightNumber:
        form.flightNumber.trim(),

      remarks:
        form.remarks.trim(),
    };

    if (!editingGuest) {
      payload.guestCode =
        form.guestCode.trim();

      payload.event =
        form.event;

      if (form.email.trim()) {
        payload.email =
          form.email.trim();
      }

      if (form.gender) {
        payload.gender =
          form.gender;
      }

      if (form.arrivalTime) {
        payload.arrivalTime =
          new Date(
            form.arrivalTime
          ).toISOString();
      }

      if (form.departureTime) {
        payload.departureTime =
          new Date(
            form.departureTime
          ).toISOString();
      }
    } else {
      /*
       * Backend allows event/location
       * changes while the guest is not
       * assigned. Include them when editing.
       */
      payload.event =
        form.event;

      if (form.email.trim()) {
        payload.email =
          form.email.trim();
      } else {
        payload.email = "";
      }

      if (form.gender) {
        payload.gender =
          form.gender;
      }

      if (form.arrivalTime) {
        payload.arrivalTime =
          new Date(
            form.arrivalTime
          ).toISOString();
      }

      if (form.departureTime) {
        payload.departureTime =
          new Date(
            form.departureTime
          ).toISOString();
      }
    }

    try {
      if (editingGuest) {
        await updateGuest(
          editingGuest._id,
          payload
        );

        setSuccess(
          "Guest updated successfully."
        );
      } else {
        await createGuest(payload);

        setSuccess(
          "Guest created successfully."
        );
      }

      /*
       * Do not use closeForm() here because
       * saving is still true at this moment.
       */
      setShowForm(false);
      setEditingGuest(null);
      setForm(emptyForm);

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to save guest."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    guest,
    status
  ) => {
    setError("");
    setSuccess("");

    try {
      await updateGuestStatus(
        guest._id,
        status
      );

      setSuccess(
        `Guest status changed to ${status}.`
      );

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to update guest status."
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
      await deleteGuest(
        deleteTarget._id
      );

      setDeleteTarget(null);

      if (
        selectedGuest?._id ===
        deleteTarget._id
      ) {
        setSelectedGuest(null);
      }

      setSuccess(
        "Guest deleted successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to delete guest."
      );
    } finally {
      setSaving(false);
    }
  };

  const getAvailableStatusActions =
    (guest) => {
      if (
        !canMutate ||
        !guest?.status
      ) {
        return [];
      }

      if (
        guest.status ===
        GUEST_STATUS.PENDING
      ) {
        return [
          GUEST_STATUS.CONFIRMED,
          GUEST_STATUS.CANCELLED,
        ];
      }

      if (
        guest.status ===
        GUEST_STATUS.CONFIRMED
      ) {
        return [
          GUEST_STATUS.CANCELLED,
        ];
      }

      return [];
    };

  return (
    <div className="guest-page">

      {/* HEADER */}

      <div className="guest-page__header">

        <div>
          <p className="guest-page__eyebrow">
            Operations
          </p>

          <h1>
            Guest Management
          </h1>

          <p>
            Manage event guests,
            travel information and
            pickup/drop requirements.
          </p>
        </div>

        {canMutate && (
          <button
            className="guest-btn guest-btn--primary"
            onClick={openCreateForm}
          >
            + Add Guest
          </button>
        )}

      </div>

      {/* ALERTS */}

      {error && (
        <div className="guest-alert guest-alert--error">
          {error}
        </div>
      )}

      {success && (
        <div className="guest-alert guest-alert--success">
          {success}
        </div>
      )}

      {/* STATISTICS */}

      <section className="guest-stats">

        <div className="guest-stat-card">
          <span>Total Guests</span>
          <strong>
            {statistics.total}
          </strong>
        </div>

        <div className="guest-stat-card">
          <span>Pending</span>
          <strong>
            {statistics.pending}
          </strong>
        </div>

        <div className="guest-stat-card">
          <span>Confirmed</span>
          <strong>
            {statistics.confirmed}
          </strong>
        </div>

        <div className="guest-stat-card">
          <span>Cancelled</span>
          <strong>
            {statistics.cancelled}
          </strong>
        </div>

      </section>

      {/* MAIN PANEL */}

      <section className="guest-panel">

        <div className="guest-toolbar">

          <input
            type="search"
            className="guest-search"
            placeholder="Search guest, phone, event or location..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          <select
            className="guest-filter"
            value={eventFilter}
            onChange={(event) =>
              setEventFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All events
            </option>

            {events.map((event) => (
              <option
                key={event._id}
                value={event._id}
              >
                {event.name}
                {event.eventCode
                  ? ` (${event.eventCode})`
                  : ""}
              </option>
            ))}
          </select>

          <select
            className="guest-filter"
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

          <button
            className="guest-btn guest-btn--secondary"
            onClick={loadData}
            disabled={loading}
          >
            Refresh
          </button>

        </div>

        {loading ? (
          <div className="guest-empty">
            Loading guests...
          </div>
        ) : filteredGuests.length === 0 ? (
          <div className="guest-empty">
            <strong>
              No guests found
            </strong>

            <span>
              Add a guest or change
              your filters.
            </span>
          </div>
        ) : (
          <div className="guest-table-wrapper">

            <table className="guest-table">

              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Event</th>
                  <th>Contact</th>
                  <th>Pickup</th>
                  <th>Drop</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredGuests.map(
                  (guest) => {

                    const statusActions =
                      getAvailableStatusActions(
                        guest
                      );

                    const fullName = [
                      guest.firstName,
                      guest.lastName,
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <tr
                        key={guest._id}
                      >

                        <td>
                          <div className="guest-name-cell">

                            <strong>
                              {fullName}
                            </strong>

                            <span>
                              {guest.guestCode}
                            </span>

                          </div>
                        </td>

                        <td>
                          {getEventName(
                            guest
                          )}
                        </td>

                        <td>
                          <div className="guest-contact-cell">

                            <span>
                              {guest.phone}
                            </span>

                            {guest.email && (
                              <small>
                                {guest.email}
                              </small>
                            )}

                          </div>
                        </td>

                        <td>
                          {getLocationName(
                            guest.pickupLocation
                          )}
                        </td>

                        <td>
                          {getLocationName(
                            guest.dropLocation
                          )}
                        </td>

                        <td>
                          <span
                            className={getStatusClass(
                              guest.status
                            )}
                          >
                            {guest.status}
                          </span>
                        </td>

                        <td>

                          <div className="guest-actions">

                            <button
                              className="guest-action"
                              onClick={() =>
                                setSelectedGuest(
                                  guest
                                )
                              }
                            >
                              View
                            </button>

                            {canMutate && (
                              <button
                                className="guest-action"
                                onClick={() =>
                                  openEditForm(
                                    guest
                                  )
                                }
                              >
                                Edit
                              </button>
                            )}

                            {statusActions.length >
                              0 && (
                              <select
                                className="guest-status-select"
                                value=""
                                onChange={(event) => {
                                  if (
                                    event.target
                                      .value
                                  ) {
                                    handleStatusChange(
                                      guest,
                                      event.target
                                        .value
                                    );
                                  }
                                }}
                              >
                                <option value="">
                                  Status
                                </option>

                                {statusActions.map(
                                  (status) => (
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
                                className="guest-action guest-action--danger"
                                onClick={() =>
                                  setDeleteTarget(
                                    guest
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

      {/* CREATE / EDIT MODAL */}

      {showForm && (
        <div className="guest-modal-backdrop">

          <div className="guest-modal">

            <div className="guest-modal__header">

              <div>

                <p className="guest-page__eyebrow">
                  Guest Details
                </p>

                <h2>
                  {editingGuest
                    ? "Edit Guest"
                    : "Add Guest"}
                </h2>

                <p>
                  Enter the guest's
                  operational and travel
                  information.
                </p>

              </div>

              <button
                className="guest-modal__close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>

            <form
              className="guest-form"
              onSubmit={handleSubmit}
            >

              <div className="guest-form-grid">

                {!editingGuest && (
                  <label>
                    Guest Code

                    <input
                      name="guestCode"
                      value={
                        form.guestCode
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="e.g. G001"
                      required
                      disabled={saving}
                    />
                  </label>
                )}

                <label>
                  Event

                  <select
                    name="event"
                    value={
                      form.event
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={saving}
                  >
                    <option value="">
                      Select event
                    </option>

                    {events.map(
                      (event) => (
                        <option
                          key={event._id}
                          value={
                            event._id
                          }
                        >
                          {event.name}

                          {event.eventCode
                            ? ` — ${event.eventCode}`
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  First Name

                  <input
                    name="firstName"
                    value={
                      form.firstName
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={50}
                    required
                    disabled={saving}
                  />
                </label>

                <label>
                  Last Name

                  <input
                    name="lastName"
                    value={
                      form.lastName
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={50}
                    disabled={saving}
                  />
                </label>

                <label>
                  Phone

                  <input
                    name="phone"
                    value={
                      form.phone
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={saving}
                  />
                </label>

                <label>
                  Email

                  <input
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Gender

                  <select
                    name="gender"
                    value={
                      form.gender
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
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

                <label>
                  Pickup Location

                  <select
                    name="pickupLocation"
                    value={
                      form.pickupLocation
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={saving}
                  >
                    <option value="">
                      Select pickup
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

                <label>
                  Drop Location

                  <select
                    name="dropLocation"
                    value={
                      form.dropLocation
                    }
                    onChange={
                      handleChange
                    }
                    required
                    disabled={saving}
                  >
                    <option value="">
                      Select drop
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

                <label>
                  Hotel Name

                  <input
                    name="hotelName"
                    value={
                      form.hotelName
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Room Number

                  <input
                    name="roomNumber"
                    value={
                      form.roomNumber
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Flight Number

                  <input
                    name="flightNumber"
                    value={
                      form.flightNumber
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Arrival Time

                  <input
                    type="datetime-local"
                    name="arrivalTime"
                    value={
                      form.arrivalTime
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />
                </label>

                <label>
                  Departure Time

                  <input
                    type="datetime-local"
                    name="departureTime"
                    value={
                      form.departureTime
                    }
                    onChange={
                      handleChange
                    }
                    disabled={saving}
                  />
                </label>

                <label className="guest-form-field--full">

                  Remarks

                  <textarea
                    name="remarks"
                    value={
                      form.remarks
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={500}
                    rows={4}
                    disabled={saving}
                  />

                  <small>
                    {
                      form.remarks.length
                    }
                    /500
                  </small>

                </label>

              </div>

              <div className="guest-modal__footer">

                <button
                  type="button"
                  className="guest-btn guest-btn--secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="guest-btn guest-btn--primary"
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

      {/* DETAILS MODAL */}

      {selectedGuest && (
        <div className="guest-modal-backdrop">

          <div className="guest-modal">

            <div className="guest-modal__header">

              <div>

                <p className="guest-page__eyebrow">
                  Guest Profile
                </p>

                <h2>
                  {selectedGuest.firstName}{" "}
                  {selectedGuest.lastName}
                </h2>

              </div>

              <button
                className="guest-modal__close"
                onClick={() =>
                  setSelectedGuest(
                    null
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="guest-details">

              <div>
                <span>Guest Code</span>
                <strong>
                  {
                    selectedGuest.guestCode
                  }
                </strong>
              </div>

              <div>
                <span>Event</span>
                <strong>
                  {getEventName(
                    selectedGuest
                  )}
                </strong>
              </div>

              <div>
                <span>Phone</span>
                <strong>
                  {
                    selectedGuest.phone
                  }
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {
                    selectedGuest.email ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>Gender</span>
                <strong>
                  {
                    selectedGuest.gender ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong
                  className={getStatusClass(
                    selectedGuest.status
                  )}
                >
                  {
                    selectedGuest.status
                  }
                </strong>
              </div>

              <div>
                <span>Pickup</span>
                <strong>
                  {getLocationName(
                    selectedGuest.pickupLocation
                  )}
                </strong>
              </div>

              <div>
                <span>Drop</span>
                <strong>
                  {getLocationName(
                    selectedGuest.dropLocation
                  )}
                </strong>
              </div>

              <div>
                <span>Hotel</span>
                <strong>
                  {
                    selectedGuest.hotelName ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>Room</span>
                <strong>
                  {
                    selectedGuest.roomNumber ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>Flight</span>
                <strong>
                  {
                    selectedGuest.flightNumber ||
                    "-"
                  }
                </strong>
              </div>

              <div>
                <span>Arrival</span>
                <strong>
                  {formatDateTime(
                    selectedGuest.arrivalTime
                  )}
                </strong>
              </div>

              <div>
                <span>Departure</span>
                <strong>
                  {formatDateTime(
                    selectedGuest.departureTime
                  )}
                </strong>
              </div>

              <div className="guest-details__full">

                <span>
                  Remarks
                </span>

                <p>
                  {
                    selectedGuest.remarks ||
                    "No remarks."
                  }
                </p>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* DELETE MODAL */}

      {deleteTarget && (
        <div className="guest-modal-backdrop">

          <div className="guest-modal guest-modal--small">

            <p className="guest-page__eyebrow">
              Confirmation
            </p>

            <h2>
              Delete Guest?
            </h2>

            <p>
              Are you sure you want to
              delete{" "}
              <strong>
                {deleteTarget.firstName}{" "}
                {deleteTarget.lastName}
              </strong>
              ?
            </p>

            <p className="guest-warning">
              The backend may reject this
              operation if the guest is
              currently assigned.
            </p>

            <div className="guest-modal__footer">

              <button
                className="guest-btn guest-btn--secondary"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="guest-btn guest-btn--danger"
                onClick={
                  handleDelete
                }
                disabled={saving}
              >
                {saving
                  ? "Deleting..."
                  : "Delete Guest"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default GuestManagement;