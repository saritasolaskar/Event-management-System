
import { useCallback, useEffect, useState } from "react";

import {
  getDriverDashboard,
  getAssignedGuests,
  markDriverEnRoute,
  markGuestPicked,
  markVenueReached,
  markReturnPickup,
  markGuestDropped,
  startDriverDuty,
  completeDriverDuty,
  updateDriverDutyExpenses,
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

const fieldStyle = {
  display: "grid",
  gap: "6px",
  marginBottom: "14px",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px",
  border: "1px solid #d0d5dd",
  borderRadius: "8px",
  fontSize: "14px",
};

const buttonStyle = {
  padding: "10px 14px",
  borderRadius: "8px",
  border: "1px solid #d0d5dd",
  cursor: "pointer",
  fontWeight: 600,
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

function formatDateTime(value) {
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

function getName(person) {
  if (!person) return "Guest";
  if (typeof person === "string") return person;

  return (
    [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    person.name ||
    "Guest"
  );
}

function getAction(guestAssignment) {
  const pickupStatus = guestAssignment.pickupStatus;
  const returnStatus = guestAssignment.returnStatus;

  if (pickupStatus === "PENDING") {
    return { label: "Start pickup", run: markDriverEnRoute };
  }

  if (pickupStatus === "DRIVER_EN_ROUTE") {
    return { label: "Mark guest picked up", run: markGuestPicked };
  }

  if (pickupStatus === "PICKED_UP") {
    return { label: "Mark venue arrival", run: markVenueReached };
  }

  if (
    pickupStatus === "DROPPED_AT_VENUE" &&
    returnStatus === "NOT_STARTED"
  ) {
    return { label: "Start return pickup", run: markReturnPickup };
  }

  if (
    pickupStatus === "DROPPED_AT_VENUE" &&
    returnStatus === "RETURN_PICKUP"
  ) {
    return { label: "Mark final drop", run: markGuestDropped };
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
      <p style={{ margin: "0 0 10px", color: "#667085" }}>{label}</p>
      <strong style={{ fontSize: "26px" }}>{value}</strong>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", min, step }) {
  return (
    <label style={fieldStyle}>
      <span>{label}</span>
      <input
        style={inputStyle}
        type={type}
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function getAssignmentInfo(assignment) {
  if (!assignment) return {};

  return {
    vehicle: assignment.vehicle?.vehicleNumber || "Not specified",
    vehicleType: assignment.vehicle?.vehicleType?.replaceAll("_", " ") || "",
    event:
      assignment.event?.name ||
      assignment.event?.eventCode ||
      "Event assignment",
    eventCode: assignment.event?.eventCode || "",
    vendor: assignment.vendor?.companyName || "",
    reportingTime: assignment.reportingTime,
    status: assignment.status || "UNKNOWN",
  };
}

const emptyExpenses = {
  DA: "",
  toll: "",
  parking: "",
  entry: "",
  remarks: "",
};

export default function DriverDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeActionId, setActiveActionId] = useState("");

  const [startKm, setStartKm] = useState("");
  const [endKm, setEndKm] = useState("");
  const [expenses, setExpenses] = useState(emptyExpenses);

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

  const assignment = dashboard?.assignment;
  const duty = dashboard?.duty;
  const assignmentInfo = getAssignmentInfo(assignment);

  useEffect(() => {
    if (duty) {
      setEndKm(String(duty.endKm || duty.startKm || ""));
      setExpenses({
        DA: String(duty.DA ?? 0),
        toll: String(duty.toll ?? 0),
        parking: String(duty.parking ?? 0),
        entry: String(duty.entry ?? 0),
        remarks: duty.remarks || "",
      });
    } else {
      setEndKm("");
      setExpenses(emptyExpenses);
    }
  }, [duty?._id, duty?.updatedAt]);

  async function runAction(actionId, action, successMessage) {
    if (activeActionId) return;

    setActiveActionId(actionId);
    setError("");
    setNotice("");

    try {
      await action();
      setNotice(successMessage);
      await loadDashboard(true);
    } catch (err) {
      setError(getError(err));
    } finally {
      setActiveActionId("");
    }
  }

  async function handleStartDuty(event) {
    event.preventDefault();

    if (!assignment?._id || startKm.trim() === "") {
      setError("Enter the starting odometer reading.");
      return;
    }

    const value = Number(startKm);

    if (!Number.isFinite(value) || value < 0) {
      setError("Starting KM must be a valid non-negative number.");
      return;
    }

    await runAction(
      "duty",
      () => startDriverDuty(getId(assignment), value),
      "Duty started successfully."
    );
  }

  async function handleCompleteDuty(event) {
    event.preventDefault();

    if (!duty?._id || endKm.trim() === "") {
      setError("Enter the ending odometer reading.");
      return;
    }

    const value = Number(endKm);

    if (
      !Number.isFinite(value) ||
      value < Number(duty.startKm)
    ) {
      setError("Ending KM cannot be less than starting KM.");
      return;
    }

    await runAction(
      "duty",
      () => completeDriverDuty(getId(duty), value),
      "Duty completed successfully."
    );
  }

  async function handleSaveExpenses(event) {
    event.preventDefault();

    if (!duty?._id) return;

    const payload = {};

    for (const key of ["DA", "toll", "parking", "entry"]) {
      if (expenses[key].trim() !== "") {
        const value = Number(expenses[key]);

        if (!Number.isFinite(value) || value < 0) {
          setError(`${key} must be a valid non-negative amount.`);
          return;
        }

        payload[key] = value;
      }
    }

    payload.remarks = expenses.remarks;

    await runAction(
      "expenses",
      () => updateDriverDutyExpenses(getId(duty), payload),
      "Duty expenses saved successfully."
    );
  }

  async function handleGuestAction(guestAssignment, action) {
    const id = getId(guestAssignment);

    if (!id || !action) return;

    await runAction(
      id,
      () => action.run(id),
      `${action.label} completed successfully.`
    );
  }

  const completedGuests = guests.filter(
    (guest) => guest.returnStatus === "DROPPED"
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
          Manage your duty, odometer readings, expenses, and guest trips.
        </p>
      </header>

      <div>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => loadDashboard(true)}
          disabled={refreshing || Boolean(activeActionId)}
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
            No assignment is currently available for your account. Contact
            your operations manager if you expected to be on duty.
          </p>
        </Message>
      ) : (
        <>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Today's Assignment</h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <p style={{ color: "#667085", marginBottom: 6 }}>Event</p>
                <strong>{assignmentInfo.event}</strong>
                {assignmentInfo.eventCode && <div>{assignmentInfo.eventCode}</div>}
              </div>

              <div>
                <p style={{ color: "#667085", marginBottom: 6 }}>Vehicle</p>
                <strong>{assignmentInfo.vehicle}</strong>
                {assignmentInfo.vehicleType && <div>{assignmentInfo.vehicleType}</div>}
              </div>

              <div>
                <p style={{ color: "#667085", marginBottom: 6 }}>Reporting time</p>
                <strong>{formatDateTime(assignmentInfo.reportingTime)}</strong>
              </div>

              <div>
                <p style={{ color: "#667085", marginBottom: 6 }}>Assignment status</p>
                <Status value={assignmentInfo.status} />
              </div>

              {assignmentInfo.vendor && (
                <div>
                  <p style={{ color: "#667085", marginBottom: 6 }}>Vendor</p>
                  <strong>{assignmentInfo.vendor}</strong>
                </div>
              )}
            </div>
          </section>

          {assignmentInfo.status === "ASSIGNED" && (
            <section style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Start Duty</h2>
              <p>
                Confirm the vehicle's odometer reading before starting the
                duty. Guest trip updates become available once duty starts.
              </p>

              <form onSubmit={handleStartDuty}>
                <Field
                  label="Starting odometer (KM)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={startKm}
                  onChange={setStartKm}
                />

                <button
                  style={buttonStyle}
                  type="submit"
                  disabled={Boolean(activeActionId)}
                >
                  {activeActionId === "duty" ? "Processing…" : "Start duty"}
                </button>
              </form>
            </section>
          )}

          {assignmentInfo.status === "ON_DUTY" && duty && (
            <>
              <section style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Active Duty</h2>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "16px",
                  }}
                >
                  <div>
                    <p style={{ color: "#667085", marginBottom: 6 }}>Duty status</p>
                    <Status value={duty.status} />
                  </div>
                  <div>
                    <p style={{ color: "#667085", marginBottom: 6 }}>Started at</p>
                    <strong>{formatDateTime(duty.dutyStartTime)}</strong>
                  </div>
                  <div>
                    <p style={{ color: "#667085", marginBottom: 6 }}>Starting KM</p>
                    <strong>{duty.startKm}</strong>
                  </div>
                </div>
              </section>

              <section style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Duty Expenses</h2>
                <p>Enter amounts in the applicable fields. Leave unused fields blank.</p>

                <form onSubmit={handleSaveExpenses}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {[
                      ["DA", "Daily allowance (DA)"],
                      ["toll", "Toll charges"],
                      ["parking", "Parking charges"],
                      ["entry", "Entry charges"],
                    ].map(([key, label]) => (
                      <Field
                        key={key}
                        label={label}
                        type="number"
                        min="0"
                        step="0.01"
                        value={expenses[key]}
                        onChange={(value) =>
                          setExpenses((current) => ({
                            ...current,
                            [key]: value,
                          }))
                        }
                      />
                    ))}
                  </div>

                  <label style={fieldStyle}>
                    <span>Remarks</span>
                    <textarea
                      style={{ ...inputStyle, minHeight: "80px" }}
                      maxLength={500}
                      value={expenses.remarks}
                      onChange={(event) =>
                        setExpenses((current) => ({
                          ...current,
                          remarks: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <button
                    style={buttonStyle}
                    type="submit"
                    disabled={Boolean(activeActionId)}
                  >
                    {activeActionId === "expenses"
                      ? "Saving…"
                      : "Save expenses"}
                  </button>
                </form>
              </section>

              <section style={cardStyle}>
                <h2 style={{ marginTop: 0 }}>Complete Duty</h2>
                <p>
                  Enter the final odometer reading after finishing the duty.
                  The ending reading must not be below {duty.startKm} KM.
                </p>

                <form onSubmit={handleCompleteDuty}>
                  <Field
                    label="Ending odometer (KM)"
                    type="number"
                    min={duty.startKm}
                    step="0.1"
                    value={endKm}
                    onChange={setEndKm}
                  />

                  <button
                    style={buttonStyle}
                    type="submit"
                    disabled={Boolean(activeActionId)}
                  >
                    {activeActionId === "duty"
                      ? "Processing…"
                      : "Complete duty"}
                  </button>
                </form>
              </section>
            </>
          )}

          {assignmentInfo.status === "ON_DUTY" && !duty && (
            <Message error>
              The assignment is marked ON DUTY, but its active duty record
              could not be loaded. Refresh the dashboard. If the problem
              continues, contact your operations manager before completing
              the duty.
            </Message>
          )}

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
              <Message>No guests are currently assigned to this duty.</Message>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {guests.map((guestAssignment, index) => {
                  const guest = guestAssignment.guest || {};
                  const id = getId(guestAssignment);
                  const action = getAction(guestAssignment);
                  const busy = activeActionId === id;

                  const canAct =
                    assignmentInfo.status === "ON_DUTY" &&
                    Boolean(duty) &&
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

                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                          <Status value={guestAssignment.pickupStatus} />
                          <Status value={guestAssignment.returnStatus} />
                        </div>
                      </div>

                      {(guest.hotelName || guest.roomNumber) && (
                        <p>
                          {guest.hotelName || ""}
                          {guest.roomNumber ? ` · Room ${guest.roomNumber}` : ""}
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
                            style={buttonStyle}
                            disabled={!canAct}
                            onClick={() => handleGuestAction(guestAssignment, action)}
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
