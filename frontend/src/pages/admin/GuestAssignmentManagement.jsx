import { useCallback, useEffect, useMemo, useState } from "react";

import { getEvents } from "../../api/event.api";
import { getGuests } from "../../api/guest.api";
import { getVehicleAssignments } from "../../api/vehicleAssignment.api";
import {
  getGuestAssignments,
  bulkAssignGuests,
  deleteGuestAssignment,
} from "../../api/guestAssignment.api";

import { useAuth } from "../../auth/AuthContext";

const panel = {
  background: "var(--surface, #fff)",
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: 12,
  padding: 20,
  minWidth: 0,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  border: "1px solid #d0d5dd",
  borderRadius: 8,
  background: "var(--surface, #fff)",
  color: "inherit",
};

const primaryButton = {
  padding: "10px 15px",
  border: 0,
  borderRadius: 8,
  background: "#175cd3",
  color: "#fff",
  fontWeight: 600,
  cursor: "pointer",
};

const secondaryButton = {
  padding: "9px 13px",
  border: "1px solid #d0d5dd",
  borderRadius: 8,
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
};

function unwrap(response) {
  if (response?.data?.data !== undefined) return response.data.data;
  if (response?.data !== undefined) return response.data;
  return response;
}

function listFrom(response) {
  const data = unwrap(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;

  return [];
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") return value._id || value.id || "";
  return String(value);
}

function getEventName(event) {
  if (!event) return "Unknown event";
  if (typeof event === "string") return event;

  return [event.eventCode, event.name].filter(Boolean).join(" · ") ||
    "Event";
}

function getGuestName(guest) {
  if (!guest) return "Unknown guest";
  if (typeof guest === "string") return guest;

  return [guest.firstName, guest.lastName].filter(Boolean).join(" ") ||
    guest.guestCode ||
    guest.email ||
    "Guest";
}

function getVehicleName(assignment) {
  if (!assignment) return "Unknown vehicle";

  const vehicle = assignment.vehicle;
  const driver = assignment.driver;

  const vehicleLabel = vehicle && typeof vehicle === "object"
    ? [vehicle.vehicleNumber, vehicle.vehicleType].filter(Boolean).join(" · ")
    : getId(vehicle);

  const driverLabel = driver && typeof driver === "object"
    ? [driver.firstName, driver.lastName].filter(Boolean).join(" ")
    : "";

  return [
    assignment.assignmentCode,
    vehicleLabel,
    driverLabel ? `Driver: ${driverLabel}` : "",
  ].filter(Boolean).join(" — ");
}

function getErrorMessage(error) {
  return error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusPill({ value }) {
  const status = String(value || "UNKNOWN").toUpperCase();

  const color = status === "DROPPED"
    ? { background: "#dcfae6", color: "#067647" }
    : status === "DROPPED_AT_VENUE" || status === "RETURN_PICKUP"
      ? { background: "#e0eaff", color: "#3538cd" }
      : status === "CANCELLED"
        ? { background: "#fee4e2", color: "#b42318" }
        : { background: "#f2f4f7", color: "#344054" };

  return (
    <span
      style={{
        ...color,
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function GuestAssignmentManagement() {
  const { user } = useAuth();
  const canManage = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER"].includes(user?.role);

  const [events, setEvents] = useState([]);
  const [guests, setGuests] = useState([]);
  const [vehicleAssignments, setVehicleAssignments] = useState([]);
  const [guestAssignments, setGuestAssignments] = useState([]);

  const [eventId, setEventId] = useState("");
  const [vehicleAssignmentId, setVehicleAssignmentId] = useState("");
  const [selectedGuests, setSelectedGuests] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        getEvents(),
        getGuests(),
        getVehicleAssignments(),
        getGuestAssignments(),
      ]);

      const setters = [
        setEvents,
        setGuests,
        setVehicleAssignments,
        setGuestAssignments,
      ];

      const names = [
        "Events",
        "Guests",
        "Vehicle assignments",
        "Guest assignments",
      ];

      const failures = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setters[index](listFrom(result.value));
        } else {
          setters[index]([]);
          failures.push(
            `${names[index]}: ${getErrorMessage(result.reason)}`
          );
        }
      });

      if (failures.length > 0) {
        setError(
          `Some data could not be loaded. ${failures.join(" | ")}`
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    loadData();
  }, [loadData]);

  const eventVehicleAssignments = useMemo(() => {
    return vehicleAssignments.filter((assignment) => {
      return (
        getId(assignment.event) === eventId &&
        assignment.status === "ASSIGNED"
      );
    });
  }, [vehicleAssignments, eventId]);

  const eventGuests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return guests.filter((guest) => {
      const belongsToEvent = getId(guest.event) === eventId;
      const isEligible = guest.status !== "CANCELLED";

      const fullName = getGuestName(guest);
      const matchesSearch = !query || [
        fullName,
        guest.guestCode,
        guest.phone,
        guest.email,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      return belongsToEvent && isEligible && matchesSearch;
    });
  }, [guests, eventId, search]);

  const assignedGuestIds = useMemo(() => {
    const ids = new Set();

    guestAssignments.forEach((assignment) => {
      const duty = assignment.vehicleAssignment;
      const dutyStatus = duty?.status;

      if (
        !assignment.isDeleted &&
        ["ASSIGNED", "ON_DUTY"].includes(dutyStatus)
      ) {
        ids.add(getId(assignment.guest));
      }
    });

    return ids;
  }, [guestAssignments]);

  const unassignedGuests = useMemo(() => {
    return eventGuests.filter((guest) => !assignedGuestIds.has(getId(guest)));
  }, [eventGuests, assignedGuestIds]);

  const selectedDuty = useMemo(() => {
    return eventVehicleAssignments.find(
      (assignment) => getId(assignment) === vehicleAssignmentId
    );
  }, [eventVehicleAssignments, vehicleAssignmentId]);

  const visibleGuestAssignments = useMemo(() => {
    return guestAssignments.filter((assignment) => {
      const duty = assignment.vehicleAssignment;
      const guest = assignment.guest;

      const matchesEvent = getId(duty?.event) === eventId;
      const query = search.trim().toLowerCase();

      const matchesSearch = !query || [
        getGuestName(guest),
        guest?.guestCode,
        duty?.assignmentCode,
        duty?.vehicle?.vehicleNumber,
        duty?.driver?.firstName,
        duty?.driver?.lastName,
        assignment.pickupStatus,
        assignment.returnStatus,
      ].some((value) => String(value || "").toLowerCase().includes(query));

      return matchesEvent && matchesSearch;
    });
  }, [guestAssignments, eventId, search]);

  function handleEventChange(value) {
    setEventId(value);
    setVehicleAssignmentId("");
    setSelectedGuests([]);
    setSearch("");
    setError("");
    setNotice("");
  }

  function toggleGuest(guestId) {
    setSelectedGuests((current) => (
      current.includes(guestId)
        ? current.filter((id) => id !== guestId)
        : [...current, guestId]
    ));
  }

  function selectAllUnassigned() {
    const ids = unassignedGuests.map((guest) => getId(guest));
    setSelectedGuests(ids);
  }

  function clearSelection() {
    setSelectedGuests([]);
  }

  async function handleAssign(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!eventId) {
      setError("Select an event first.");
      return;
    }

    if (!vehicleAssignmentId) {
      setError("Select a vehicle duty.");
      return;
    }

    if (selectedGuests.length === 0) {
      setError("Select at least one guest to assign.");
      return;
    }

    setSaving(true);

    try {
      await bulkAssignGuests(vehicleAssignmentId, selectedGuests);

      setNotice(
        `${selectedGuests.length} guest(s) assigned successfully to ${
          selectedDuty?.assignmentCode || "the selected vehicle duty"
        }.`
      );

      setSelectedGuests([]);
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(assignment) {
    if (!canManage || !assignment?._id || busyId) return;

    const pickupStatus = assignment.pickupStatus || "PENDING";
    const returnStatus = assignment.returnStatus || "NOT_STARTED";

    if (pickupStatus !== "PENDING" || returnStatus !== "NOT_STARTED") {
      setError("This guest's trip has started. It cannot be removed from this page.");
      return;
    }

    const confirmed = window.confirm(
      `Remove ${getGuestName(assignment.guest)} from this vehicle duty?`
    );

    if (!confirmed) return;

    setBusyId(assignment._id);
    setError("");
    setNotice("");

    try {
      await deleteGuestAssignment(assignment._id);
      setNotice("Guest assignment removed.");
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div style={{ display: "grid", gap: 20, color: "var(--text-primary, #172033)" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Guest Assignments</h1>
          <p style={{ margin: 0, color: "#667085" }}>
            Assign guests to event vehicle duties and monitor pickup and return progress.
          </p>
        </div>

        <button
          type="button"
          style={secondaryButton}
          onClick={loadData}
          disabled={loading || saving}
        >
          Refresh
        </button>
      </header>

      {error && (
        <div
          role="alert"
          style={{ ...panel, borderColor: "#fecdca", color: "#b42318" }}
        >
          {error}
        </div>
      )}

      {notice && (
        <div
          role="status"
          style={{ ...panel, borderColor: "#abefc6", color: "#067647" }}
        >
          {notice}
        </div>
      )}

      <section style={panel}>
        <h2 style={{ marginTop: 0 }}>Assign guests to a vehicle duty</h2>

        {loading ? (
          <p>Loading events, guests and vehicle duties…</p>
        ) : (
          <form onSubmit={handleAssign} style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              <label style={{ display: "grid", gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Event *</span>
                <select
                  required
                  style={inputStyle}
                  value={eventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                >
                  <option value="">Select event</option>
                  {events
                    .filter((item) => !["COMPLETED", "CANCELLED"].includes(item.status))
                    .map((item) => (
                      <option key={item._id} value={item._id}>
                        {getEventName(item)}
                      </option>
                    ))}
                </select>
              </label>

              <label style={{ display: "grid", gap: 7 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Vehicle duty *</span>
                <select
                  required
                  style={inputStyle}
                  value={vehicleAssignmentId}
                  onChange={(e) => setVehicleAssignmentId(e.target.value)}
                  disabled={!eventId}
                >
                  <option value="">Select vehicle duty</option>
                  {eventVehicleAssignments.map((item) => (
                    <option key={item._id} value={item._id}>
                      {getVehicleName(item)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {eventId && eventVehicleAssignments.length === 0 && (
              <p style={{ color: "#b54708", margin: 0 }}>
                No vehicle duties with ASSIGNED status are available for this event.
                Create a vehicle duty first, or check whether its duty has already started.
              </p>
            )}

            {eventId && (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <strong>Available guests</strong>
                    <div style={{ fontSize: 13, color: "#667085", marginTop: 4 }}>
                      {unassignedGuests.length} unassigned guest(s)
                      {selectedGuests.length > 0
                        ? ` · ${selectedGuests.length} selected`
                        : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      style={secondaryButton}
                      onClick={selectAllUnassigned}
                      disabled={unassignedGuests.length === 0}
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      style={secondaryButton}
                      onClick={clearSelection}
                      disabled={selectedGuests.length === 0}
                    >
                      Clear selection
                    </button>
                  </div>
                </div>

                <input
                  type="search"
                  style={inputStyle}
                  placeholder="Search guest name, code, phone or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                {unassignedGuests.length === 0 ? (
                  <p style={{ color: "#667085" }}>
                    No unassigned guests are available for this event.
                  </p>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        borderCollapse: "collapse",
                        minWidth: 620,
                      }}
                    >
                      <thead>
                        <tr style={{ textAlign: "left", background: "#f9fafb" }}>
                          <th style={{ padding: 10, width: 50 }}>Select</th>
                          <th style={{ padding: 10 }}>Guest</th>
                          <th style={{ padding: 10 }}>Guest code</th>
                          <th style={{ padding: 10 }}>Pickup</th>
                          <th style={{ padding: 10 }}>Drop</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unassignedGuests
                          .filter((guest) => {
                            const query = search.trim().toLowerCase();
                            if (!query) return true;

                            return [
                              getGuestName(guest),
                              guest.guestCode,
                              guest.phone,
                              guest.email,
                            ].some((value) =>
                              String(value || "").toLowerCase().includes(query)
                            );
                          })
                          .map((guest) => {
                            const id = getId(guest);

                            return (
                              <tr key={id} style={{ borderBottom: "1px solid #eaecf0" }}>
                                <td style={{ padding: 10 }}>
                                  <input
                                    type="checkbox"
                                    checked={selectedGuests.includes(id)}
                                    onChange={() => toggleGuest(id)}
                                    aria-label={`Select ${getGuestName(guest)}`}
                                  />
                                </td>
                                <td style={{ padding: 10 }}>
                                  <strong>{getGuestName(guest)}</strong>
                                  <div style={{ color: "#667085", fontSize: 12 }}>
                                    {guest.phone || guest.email || ""}
                                  </div>
                                </td>
                                <td style={{ padding: 10 }}>{guest.guestCode || "—"}</td>
                                <td style={{ padding: 10 }}>
                                  {guest.pickupLocation?.name || "—"}
                                </td>
                                <td style={{ padding: 10 }}>
                                  {guest.dropLocation?.name || "—"}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                type="submit"
                style={primaryButton}
                disabled={
                  !canManage ||
                  saving ||
                  loading ||
                  !eventId ||
                  !vehicleAssignmentId ||
                  selectedGuests.length === 0
                }
              >
                {saving
                  ? "Assigning…"
                  : `Assign ${selectedGuests.length || ""} guest(s)`}
              </button>
            </div>

            {!canManage && (
              <p style={{ color: "#b54708", margin: 0 }}>
                Your role can view assignments but cannot create or remove them.
              </p>
            )}
          </form>
        )}
      </section>

      <section style={panel}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 5px" }}>Assigned guests</h2>
            <span style={{ color: "#667085", fontSize: 13 }}>
              {visibleGuestAssignments.length} assignment(s) shown
            </span>
          </div>

          {eventId && (
            <button
              type="button"
              style={secondaryButton}
              onClick={() => setSearch("")}
            >
              Clear search
            </button>
          )}
        </div>

        {!eventId ? (
          <p style={{ color: "#667085" }}>
            Select an event above to view its guest assignments.
          </p>
        ) : loading ? (
          <p>Loading guest assignments…</p>
        ) : visibleGuestAssignments.length === 0 ? (
          <p style={{ color: "#667085" }}>
            No guest assignments found for this event.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: 1050,
              }}
            >
              <thead>
                <tr style={{ textAlign: "left", background: "#f9fafb" }}>
                  {[
                    "Guest",
                    "Vehicle duty",
                    "Pickup order",
                    "Drop order",
                    "Pickup status",
                    "Return status",
                    "Assigned on",
                    "Action",
                  ].map((label) => (
                    <th
                      key={label}
                      style={{
                        padding: "12px 10px",
                        fontSize: 12,
                        color: "#475467",
                        borderBottom: "1px solid #eaecf0",
                      }}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {visibleGuestAssignments.map((assignment) => {
                  const guest = assignment.guest;
                  const duty = assignment.vehicleAssignment;

                  const canRemove =
                    canManage &&
                    assignment.pickupStatus === "PENDING" &&
                    assignment.returnStatus === "NOT_STARTED" &&
                    duty?.status === "ASSIGNED";

                  return (
                    <tr key={assignment._id} style={{ borderBottom: "1px solid #eaecf0" }}>
                      <td style={{ padding: "13px 10px" }}>
                        <strong>{getGuestName(guest)}</strong>
                        <div style={{ color: "#667085", fontSize: 12 }}>
                          {guest?.guestCode || ""}
                        </div>
                      </td>
                      <td style={{ padding: "13px 10px" }}>
                        {getVehicleName(duty)}
                      </td>
                      <td style={{ padding: "13px 10px" }}>
                        {assignment.pickupSequence ?? 1}
                      </td>
                      <td style={{ padding: "13px 10px" }}>
                        {assignment.dropSequence ?? 1}
                      </td>
                      <td style={{ padding: "13px 10px" }}>
                        <StatusPill value={assignment.pickupStatus} />
                      </td>
                      <td style={{ padding: "13px 10px" }}>
                        <StatusPill value={assignment.returnStatus} />
                      </td>
                      <td style={{ padding: "13px 10px", whiteSpace: "nowrap" }}>
                        {formatDate(assignment.createdAt)}
                      </td>
                      <td style={{ padding: "13px 10px" }}>
                        {canRemove ? (
                          <button
                            type="button"
                            style={{ ...secondaryButton, color: "#b42318" }}
                            disabled={Boolean(busyId)}
                            onClick={() => handleRemove(assignment)}
                          >
                            {busyId === assignment._id ? "Removing…" : "Remove"}
                          </button>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}