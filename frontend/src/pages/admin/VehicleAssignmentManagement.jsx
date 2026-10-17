import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

import { getVehicleAssignments, createVehicleAssignment, cancelVehicleAssignment } from "../../api/vehicleAssignment.api";
import { getEvents } from "../../api/event.api";
import { getVendors } from "../../api/vendor.api";
import { getVehicles } from "../../api/vehicle.api";
import { getDrivers } from "../../api/driver.api";
import { getLocations } from "../../api/location.api";
import api from "../../api/axios";

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

function personName(person) {
  if (!person) return "—";
  if (typeof person === "string") return person;
  return [person.firstName, person.lastName].filter(Boolean).join(" ") ||
    person.name ||
    person.email ||
    "—";
}

function eventName(event) {
  if (!event) return "—";
  if (typeof event === "string") return event;
  return [event.eventCode, event.name].filter(Boolean).join(" · ") || "Event";
}

function vendorName(vendor) {
  if (!vendor) return "—";
  if (typeof vendor === "string") return vendor;
  return vendor.companyName || vendor.name || "Vendor";
}

function vehicleName(vehicle) {
  if (!vehicle) return "—";
  if (typeof vehicle === "string") return vehicle;
  return [vehicle.vehicleNumber, vehicle.vehicleType].filter(Boolean).join(" · ");
}

function locationName(location) {
  if (!location) return "—";
  if (typeof location === "string") return location;
  return [location.name, location.city].filter(Boolean).join(", ") || "Location";
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

function errorMessage(error) {
  return error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";
}

const emptyForm = {
  event: "",
  vendor: "",
  vehicle: "",
  driver: "",
  commercialPackage: "",
  reportingLocation: "",
  reportingTime: "",
  remarks: "",
};

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 7, minWidth: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

function StatusPill({ value }) {
  const status = String(value || "UNKNOWN").toUpperCase();
  const color = status === "ON_DUTY"
    ? { background: "#dcfae6", color: "#067647" }
    : status === "COMPLETED"
      ? { background: "#e0eaff", color: "#3538cd" }
      : status === "CANCELLED"
        ? { background: "#fee4e2", color: "#b42318" }
        : { background: "#f2f4f7", color: "#344054" };

  return (
    <span style={{
      ...color,
      display: "inline-block",
      padding: "5px 9px",
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 700,
      whiteSpace: "nowrap",
    }}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function VehicleAssignmentManagement() {
  const { user } = useAuth();
  const canManage = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER"].includes(user?.role);

  const [assignments, setAssignments] = useState([]);
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getVehicleAssignments();
      setAssignments(listFrom(response));
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadOptions = useCallback(async () => {
    setOptionsLoading(true);
    setError("");

    const requests = await Promise.allSettled([
      getEvents(),
      getVendors(),
      getVehicles(),
      getDrivers(),
      api.get("/commercial-packages/active"),
      getLocations(),
    ]);

    const setters = [
      setEvents,
      setVendors,
      setVehicles,
      setDrivers,
      setPackages,
      setLocations,
    ];

    const names = [
      "events",
      "vendors",
      "vehicles",
      "drivers",
      "commercial packages",
      "locations",
    ];

    const failures = [];

    requests.forEach((result, index) => {
      if (result.status === "fulfilled") {
        setters[index](listFrom(result.value));
      } else {
        setters[index]([]);
        failures.push(names[index]);
      }
    });

    if (failures.length) {
      setError(`Could not load: ${failures.join(", ")}. Check your account permissions and try refreshing.`);
    }

    setOptionsLoading(false);
  }, []);

  const refreshAll = useCallback(async () => {
    setError("");
    setNotice("");
    await Promise.all([loadAssignments(), loadOptions()]);
  }, [loadAssignments, loadOptions]);

  useEffect(() => {
    loadAssignments();
    loadOptions();
  }, [loadAssignments, loadOptions]);

  const filteredVehicles = useMemo(() => {
    if (!form.vendor) return [];
    return vehicles.filter((vehicle) => {
      const sameVendor = getId(vehicle.vendor) === form.vendor;
      const availableStatus = !vehicle.status || vehicle.status === "ASSIGNED";
      return sameVendor && availableStatus;
    });
  }, [vehicles, form.vendor]);

  const filteredDrivers = useMemo(() => {
    if (!form.vendor) return [];
    return drivers.filter((driver) => {
      const sameVendor = getId(driver.vendor) === form.vendor;
      return sameVendor && (!driver.status || driver.status === "ACTIVE");
    });
  }, [drivers, form.vendor]);

  const filteredAssignments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return assignments;

    return assignments.filter((item) => [
      item.assignmentCode,
      eventName(item.event),
      vendorName(item.vendor),
      vehicleName(item.vehicle),
      personName(item.driver),
      item.status,
    ].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [assignments, search]);

  function updateField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      if (field === "vendor") {
        next.vehicle = "";
        next.driver = "";
      }

      if (field === "driver") {
        const driver = drivers.find((item) => getId(item) === value);
        const linkedVehicle = driver ? getId(driver.currentVehicle) : "";

        if (linkedVehicle && filteredVehicles.some((item) => getId(item) === linkedVehicle)) {
          next.vehicle = linkedVehicle;
        }
      }

      return next;
    });
  }

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.event || !form.vendor || !form.vehicle || !form.driver || !form.commercialPackage) {
      setError("Select an event, vendor, vehicle, driver, and commercial package.");
      return;
    }

    const selectedVehicle = vehicles.find((item) => getId(item) === form.vehicle);
    if (selectedVehicle && getId(selectedVehicle.currentDriver) !== form.driver) {
      setError("The selected vehicle must already be linked to the selected driver. Update the vehicle's driver first.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        event: form.event,
        vendor: form.vendor,
        vehicle: form.vehicle,
        driver: form.driver,
        commercialPackage: form.commercialPackage,
        ...(form.reportingLocation ? { reportingLocation: form.reportingLocation } : {}),
        ...(form.reportingTime ? { reportingTime: new Date(form.reportingTime).toISOString() } : {}),
        ...(form.remarks.trim() ? { remarks: form.remarks.trim() } : {}),
      };

      await createVehicleAssignment(payload);
      setNotice("Vehicle duty assignment created successfully.");
      setForm(emptyForm);
      setShowForm(false);
      await loadAssignments();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(item) {
    if (!item?._id || busyId) return;

    const confirmed = window.confirm(
      `Cancel assignment ${item.assignmentCode || ""}? This is only allowed before duty starts and when no guests are assigned.`
    );

    if (!confirmed) return;

    setBusyId(item._id);
    setError("");
    setNotice("");

    try {
      await cancelVehicleAssignment(item._id);
      setNotice("Assignment cancelled successfully.");
      await loadAssignments();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  return (
    <div style={{ display: "grid", gap: 20, color: "var(--text-primary, #172033)" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>Vehicle Duty Assignments</h1>
          <p style={{ margin: 0, color: "#667085" }}>
            Assign an event, vendor, vehicle, driver and commercial package to a duty.
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" style={secondaryButton} onClick={refreshAll} disabled={loading || optionsLoading}>
            Refresh
          </button>
          {canManage && (
            <button type="button" style={primaryButton} onClick={() => { setShowForm((value) => !value); setError(""); setNotice(""); }}>
              {showForm ? "Close form" : "Create assignment"}
            </button>
          )}
        </div>
      </header>

      {error && <div role="alert" style={{ ...panel, borderColor: "#fecdca", color: "#b42318" }}>{error}</div>}
      {notice && <div role="status" style={{ ...panel, borderColor: "#abefc6", color: "#067647" }}>{notice}</div>}

      {showForm && canManage && (
        <section style={panel}>
          <h2 style={{ marginTop: 0 }}>New assignment</h2>

          {optionsLoading ? (
            <p>Loading events, vehicles, drivers and packages…</p>
          ) : (
            <form onSubmit={handleCreate} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
                <Field label="Event *">
                  <select required style={inputStyle} value={form.event} onChange={(e) => updateField("event", e.target.value)}>
                    <option value="">Select event</option>
                    {events.filter((item) => !["COMPLETED", "CANCELLED"].includes(item.status)).map((item) => (
                      <option key={item._id} value={item._id}>{eventName(item)}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Vendor *">
                  <select required style={inputStyle} value={form.vendor} onChange={(e) => updateField("vendor", e.target.value)}>
                    <option value="">Select vendor</option>
                    {vendors.filter((item) => item.status === "ACTIVE" || !item.status).map((item) => (
                      <option key={item._id} value={item._id}>{vendorName(item)}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Vehicle *">
                  <select required style={inputStyle} value={form.vehicle} onChange={(e) => updateField("vehicle", e.target.value)} disabled={!form.vendor}>
                    <option value="">Select vehicle</option>
                    {filteredVehicles.map((item) => (
                      <option key={item._id} value={item._id}>
                        {vehicleName(item)}{item.currentDriver ? "" : " (no linked driver)"}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: "#667085" }}>Only vehicles from the selected vendor are shown.</small>
                </Field>

                <Field label="Driver *">
                  <select required style={inputStyle} value={form.driver} onChange={(e) => updateField("driver", e.target.value)} disabled={!form.vendor}>
                    <option value="">Select driver</option>
                    {filteredDrivers.map((item) => (
                      <option key={item._id} value={item._id}>{personName(item)}</option>
                    ))}
                  </select>
                  <small style={{ color: "#667085" }}>The driver must be active and belong to the selected vendor.</small>
                </Field>

                <Field label="Commercial package *">
                  <select required style={inputStyle} value={form.commercialPackage} onChange={(e) => updateField("commercialPackage", e.target.value)}>
                    <option value="">Select package</option>
                    {packages.filter((item) => item.isActive !== false).map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} — Client ₹{item.clientBaseRate}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Reporting location">
                  <select style={inputStyle} value={form.reportingLocation} onChange={(e) => updateField("reportingLocation", e.target.value)}>
                    <option value="">Not specified</option>
                    {locations.map((item) => (
                      <option key={item._id} value={item._id}>{locationName(item)}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Reporting date and time">
                  <input type="datetime-local" style={inputStyle} value={form.reportingTime} onChange={(e) => updateField("reportingTime", e.target.value)} />
                </Field>

                <Field label="Remarks">
                  <input style={inputStyle} maxLength={500} value={form.remarks} onChange={(e) => updateField("remarks", e.target.value)} placeholder="Optional duty instructions" />
                </Field>
              </div>

              {form.vendor && filteredVehicles.length === 0 && (
                <p style={{ color: "#b54708", margin: 0 }}>No eligible vehicles found for this vendor. Check that a vehicle is registered and assigned to a driver.</p>
              )}

              {form.vendor && filteredDrivers.length === 0 && (
                <p style={{ color: "#b54708", margin: 0 }}>No active drivers found for this vendor.</p>
              )}

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button type="submit" style={primaryButton} disabled={saving || optionsLoading}>
                  {saving ? "Creating…" : "Create assignment"}
                </button>
                <button type="button" style={secondaryButton} disabled={saving} onClick={() => { setShowForm(false); setForm(emptyForm); }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      )}

      <section style={panel}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: "0 0 5px" }}>Assignments</h2>
            <span style={{ color: "#667085", fontSize: 13 }}>{filteredAssignments.length} shown · {assignments.length} total</span>
          </div>
          <input
            type="search"
            style={{ ...inputStyle, maxWidth: 340 }}
            placeholder="Search event, vehicle, driver or status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading assignments…</p>
        ) : filteredAssignments.length === 0 ? (
          <div style={{ padding: "30px 10px", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 8px" }}>No assignments found</h3>
            <p style={{ color: "#667085", margin: 0 }}>Create a duty assignment to connect a vehicle and driver to an event.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 850 }}>
              <thead>
                <tr style={{ textAlign: "left", background: "#f9fafb" }}>
                  {["Assignment", "Event", "Vendor", "Vehicle", "Driver", "Reporting time", "Status", "Action"].map((label) => (
                    <th key={label} style={{ padding: "12px 10px", fontSize: 12, color: "#475467", borderBottom: "1px solid #eaecf0" }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((item) => (
                  <tr key={item._id} style={{ borderBottom: "1px solid #eaecf0" }}>
                    <td style={{ padding: "13px 10px", fontWeight: 600 }}>{item.assignmentCode || item._id}</td>
                    <td style={{ padding: "13px 10px" }}>{eventName(item.event)}</td>
                    <td style={{ padding: "13px 10px" }}>{vendorName(item.vendor)}</td>
                    <td style={{ padding: "13px 10px" }}>{vehicleName(item.vehicle)}</td>
                    <td style={{ padding: "13px 10px" }}>{personName(item.driver)}</td>
                    <td style={{ padding: "13px 10px", whiteSpace: "nowrap" }}>{formatDate(item.reportingTime)}</td>
                    <td style={{ padding: "13px 10px" }}><StatusPill value={item.status} /></td>
                    <td style={{ padding: "13px 10px" }}>
                      {canManage && item.status === "ASSIGNED" ? (
                        <button
                          type="button"
                          style={{ ...secondaryButton, color: "#b42318" }}
                          disabled={Boolean(busyId)}
                          onClick={() => handleCancel(item)}
                        >
                          {busyId === item._id ? "Cancelling…" : "Cancel"}
                        </button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}