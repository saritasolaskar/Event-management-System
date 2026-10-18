
import { useCallback, useEffect, useState } from "react";

import {
  getDriverDashboard,
  getAssignedGuests,
  markDriverEnRoute,
  markGuestPicked,
  markVenueReached,
  markReturnPickup,
  markGuestDropped,
} from "../../api/driverPortal.api";

const cardStyle = {
  background: "var(--surface, #ffffff)",
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: "12px",
  padding: "20px",
  minWidth: 0,
};

const pageStyle = {
  display: "grid",
  gap: "20px",
  color: "var(--text-primary, #172033)",
};

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getError(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
}

function getId(item) {
  return item?._id || item?.id || "";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getName(person) {
  if (!person) return "Guest";

  if (typeof person === "string") return person;

  return (
    [person.firstName, person.lastName]
      .filter(Boolean)
      .join(" ") ||
    person.name ||
    "Guest"
  );
}

function getAction(guestAssignment) {
  const pickupStatus = guestAssignment.pickupStatus;
  const returnStatus = guestAssignment.returnStatus;

  if (pickupStatus === "PENDING") {
    return {
      label: "Start pickup",
      run: markDriverEnRoute,
    };
  }

  if (pickupStatus === "DRIVER_EN_ROUTE") {
    return {
      label: "Mark guest picked up",
      run: markGuestPicked,
    };
  }

  if (pickupStatus === "PICKED_UP") {
    return {
      label: "Mark venue arrival",
      run: markVenueReached,
    };
  }

  if (
    pickupStatus === "DROPPED_AT_VENUE" &&
    returnStatus === "NOT_STARTED"
  ) {
    return {
      label: "Start return pickup",
      run: markReturnPickup,
    };
  }

  if (
    pickupStatus === "DROPPED_AT_VENUE" &&
    returnStatus === "RETURN_PICKUP"
  ) {
    return {
      label: "Mark final drop",
      run: markGuestDropped,
    };
  }

  return null;
}

function Status({ value }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#f2f4f7",
        borderRadius: "20px",
        padding: "5px 9px",
        fontSize: "12px",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {String(value || "UNKNOWN").replaceAll("_", " ")}
    </span>
  );
}

function Message({ children, error = false }) {
  return (
    <div
      role={error ? "alert" : "status"}
      style={{
        ...cardStyle,
        color: error ? "#b42318" : "inherit",
      }}
    >
      {children}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div style={cardStyle}>
      <p style={{ margin: "0 0 10px", color: "#667085" }}>
        {label}
      </p>
      <strong style={{ fontSize: "26px" }}>{value}</strong>
    </div>
  );
}

function getAssignmentInfo(assignment) {
  if (!assignment) return {};

  return {
    vehicle:
      assignment.vehicle?.vehicleNumber ||
      "Not specified",
    vehicleType:
      assignment.vehicle?.vehicleType?.replaceAll("_", " ") ||
      "",
    event:
      assignment.event?.name ||
      assignment.event?.eventCode ||
      "Event assignment",
    eventCode: assignment.event?.eventCode || "",
    vendor:
      assignment.vendor?.companyName ||
      "",
    reportingTime: assignment.reportingTime,
    status: assignment.status || "UNKNOWN",
  };
}

export default function DriverDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeActionId, setActiveActionId] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

if (!isRefresh) {
  setNotice("");
}

    try {
      const results = await Promise.allSettled([
        getDriverDashboard(),
        getAssignedGuests(),
      ]);

      const dashboardResult = results[0];
      const guestsResult = results[1];

      if (dashboardResult.status === "fulfilled") {
        setDashboard(unwrap(dashboardResult.value));
      } else {
        setDashboard(null);

        if (dashboardResult.reason?.response?.status !== 404) {
          setError(getError(dashboardResult.reason));
        }
      }

      if (guestsResult.status === "fulfilled") {
        const data = unwrap(guestsResult.value);

        setGuests(Array.isArray(data) ? data : []);
      } else {
        setGuests([]);

        if (guestsResult.reason?.response?.status !== 404) {
          setError((current) =>
            current
              ? `${current} Guest list could not be loaded.`
              : getError(guestsResult.reason)
          );
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function handleAction(guestAssignment, action) {
    const id = getId(guestAssignment);

    if (!id || !action || activeActionId) return;

    setActiveActionId(id);
    setError("");
    setNotice("");

    try {
      await action.run(id);

      setNotice(`${action.label} completed successfully.`);
      await loadDashboard(true);
    } catch (err) {
      setError(getError(err));
    } finally {
      setActiveActionId("");
    }
  }

  const assignment = dashboard?.assignment;
  const assignmentInfo = getAssignmentInfo(assignment);

  const completedGuests = guests.filter(
    (guest) =>
      guest.returnStatus === "DROPPED"
  ).length;

  const pendingGuests = guests.length - completedGuests;

  if (loading) {
    return <Message>Loading your driver dashboard…</Message>;
  }

  return (
    <div style={pageStyle}>
      <header>
        <h1 style={{ margin: "0 0 8px", fontSize: "28px" }}>
          Driver Dashboard
        </h1>
        <p style={{ margin: 0, color: "#667085" }}>
          View your duty assignment and update guest trip progress.
        </p>
      </header>

      <div>
        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing || Boolean(activeActionId)}
          style={{ padding: "9px 14px", cursor: "pointer" }}
        >
          {refreshing ? "Refreshing…" : "Refresh dashboard"}
        </button>
      </div>

      {error && <Message error>{error}</Message>}
      {notice && <Message>{notice}</Message>}

      {!assignment ? (
        <Message>
          <h2 style={{ marginTop: 0 }}>No active assignment</h2>
          <p style={{ marginBottom: 0 }}>
            No assignment is currently available for your account.
            If you are expected to be on duty, contact your operations
            manager to check the assignment and reporting time.
          </p>
        </Message>
      ) : (
        <>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Today's Duty</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <p style={{ color: "#667085", marginBottom: 6 }}>
                  Event
                </p>
                <strong>{assignmentInfo.event}</strong>
                {assignmentInfo.eventCode && (
                  <div>{assignmentInfo.eventCode}</div>
                )}
              </div>

              <div>
                <p style={{ color: "#667085", marginBottom: 6 }}>
                  Vehicle
                </p>
                <strong>{assignmentInfo.vehicle}</strong>
                {assignmentInfo.vehicleType && (
                  <div>{assignmentInfo.vehicleType}</div>
                )}
              </div>

              <div>
                <p style={{ color: "#667085", marginBottom: 6 }}>
                  Reporting time
                </p>
                <strong>
                  {formatDateTime(assignmentInfo.reportingTime)}
                </strong>
              </div>

              <div>
                <p style={{ color: "#667085", marginBottom: 6 }}>
                  Duty status
                </p>
                <Status value={assignmentInfo.status} />
              </div>

              {assignmentInfo.vendor && (
                <div>
                  <p style={{ color: "#667085", marginBottom: 6 }}>
                    Vendor
                  </p>
                  <strong>{assignmentInfo.vendor}</strong>
                </div>
              )}
            </div>

            {assignmentInfo.status !== "ON_DUTY" && (
              <p style={{ color: "#9a6700", marginBottom: 0 }}>
                Guest status updates become available after operations
                starts your duty.
              </p>
            )}
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "16px",
            }}
          >
            <Metric label="Assigned guests" value={guests.length} />
            <Metric label="Pending drop-offs" value={pendingGuests} />
            <Metric label="Completed drop-offs" value={completedGuests} />
          </section>

          <section style={pageStyle}>
            <h2 style={{ margin: 0 }}>Assigned Guests</h2>

            {guests.length === 0 ? (
              <Message>
                No guests are currently assigned to this duty.
              </Message>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {guests.map((guestAssignment, index) => {
                  const guest = guestAssignment.guest || {};
                  const id = getId(guestAssignment);
                  const action = getAction(guestAssignment);
                  const busy = activeActionId === id;
                  const canAct =
                    assignment.status === "ON_DUTY" &&
                    Boolean(action) &&
                    !activeActionId;

                  return (
                    <article key={id || index} style={cardStyle}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "16px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          <h3 style={{ margin: "0 0 6px" }}>
                            {getName(guest)}
                          </h3>
                          <p style={{ margin: "0 0 6px", color: "#667085" }}>
                            Guest code: {guest.guestCode || "—"}
                          </p>
                          <p style={{ margin: 0 }}>
                            Phone: {guest.phone || "—"}
                          </p>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "8px",
                          }}
                        >
                          <Status value={guestAssignment.pickupStatus} />
                          <Status value={guestAssignment.returnStatus} />
                        </div>
                      </div>

                      {(guest.hotelName || guest.roomNumber) && (
                        <p>
                          {guest.hotelName || ""}
                          {guest.roomNumber
                            ? ` · Room ${guest.roomNumber}`
                            : ""}
                        </p>
                      )}

                      {guest.remarks && (
                        <p style={{ color: "#667085" }}>
                          Guest remarks: {guest.remarks}
                        </p>
                      )}

                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "center",
                          flexWrap: "wrap",
                          marginTop: "16px",
                        }}
                      >
                        {action ? (
                          <button
                            type="button"
                            disabled={!canAct}
                            onClick={() =>
                              handleAction(guestAssignment, action)
                            }
                            style={{
                              padding: "10px 14px",
                              cursor: canAct ? "pointer" : "not-allowed",
                            }}
                          >
                            {busy ? "Updating…" : action.label}
                          </button>
                        ) : (
                          <Status value="COMPLETED" />
                        )}

                        <span style={{ color: "#667085", fontSize: "13px" }}>
                          Pickup sequence: {guestAssignment.pickupSequence ?? "—"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
