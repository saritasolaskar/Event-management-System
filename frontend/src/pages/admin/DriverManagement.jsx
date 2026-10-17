import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  createDriver,
  deleteDriver,
  getDrivers,
  updateDriver,
  updateDriverStatus,
} from "../../api/driver.api";
import { getVendors } from "../../api/vendor.api";
import { getVehicles } from "../../api/vehicle.api";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { ROLES } from "../../utils/roles";
import "../../styles/management-pages.css";

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: "",
  vendor: "",
  currentVehicle: "",
  licenseNumber: "",
  licenseExpiry: "",
  badgeNumber: "",
  policeVerificationExpiry: "",
  medicalCertificateExpiry: "",
};

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"];

const unwrap = (response) =>
  response?.data?.data ?? response?.data ?? response ?? [];

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }
  return String(value);
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const getVendorName = (driver) =>
  typeof driver.vendor === "object"
    ? driver.vendor?.companyName || "—"
    : "—";

const getVehicleLabel = (vehicle) =>
  `${vehicle.vehicleNumber || "Vehicle"}${vehicle.vehicleType ? ` · ${vehicle.vehicleType}` : ""}`;

export default function DriverManagement() {
  const { user } = useAuth();
  const isAdmin = [ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(user?.role);
  const canManage = [ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.OPERATIONS_MANAGER].includes(user?.role);

  const [drivers, setDrivers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [passwordSetupLink, setPasswordSetupLink] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [driverResponse, vendorResponse, vehicleResponse] =
        await Promise.all([getDrivers(), getVendors(), getVehicles()]);

      const driverData = unwrap(driverResponse);
      const vendorData = unwrap(vendorResponse);
      const vehicleData = unwrap(vehicleResponse);

      setDrivers(Array.isArray(driverData) ? driverData : []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
      setVehicles(Array.isArray(vehicleData) ? vehicleData : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return drivers.filter((driver) => {
      const text = [
        driver.firstName,
        driver.lastName,
        driver.phone,
        driver.email,
        driver.licenseNumber,
        getVendorName(driver),
        driver.status,
      ].filter(Boolean).join(" ").toLowerCase();

      return (
        (!query || text.includes(query)) &&
        (statusFilter === "ALL" || driver.status === statusFilter)
      );
    });
  }, [drivers, search, statusFilter]);

  const availableVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const sameVendor = !form.vendor || getId(vehicle.vendor) === form.vendor;
      const available = vehicle.status === "AVAILABLE";
      const alreadySelected = editingId &&
        getId(vehicle.currentDriver) === editingId;

      return sameVendor && (available || alreadySelected);
    });
  }, [vehicles, form.vendor, editingId]);

  const openCreate = () => {
    setEditingId("");
    setForm(EMPTY_FORM);
    setPasswordSetupLink("");
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const openEdit = (driver) => {
    setEditingId(getId(driver));
    setForm({
      firstName: driver.firstName || "",
      lastName: driver.lastName || "",
      phone: driver.phone || "",
      email: driver.email || "",
      dateOfBirth: toDateInput(driver.dateOfBirth),
      gender: driver.gender || "",
      vendor: getId(driver.vendor),
      currentVehicle: getId(driver.currentVehicle),
      licenseNumber: driver.licenseNumber || "",
      licenseExpiry: toDateInput(driver.licenseExpiry),
      badgeNumber: driver.badgeNumber || "",
      policeVerificationExpiry: toDateInput(driver.policeVerificationExpiry),
      medicalCertificateExpiry: toDateInput(driver.medicalCertificateExpiry),
    });
    setPasswordSetupLink("");
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditingId("");
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "vendor" ? { currentVehicle: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setPasswordSetupLink("");

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.phone.trim() ||
      !form.vendor ||
      !form.licenseNumber.trim() ||
      !form.licenseExpiry
    ) {
      setError("Complete all required fields before saving.");
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim(),
      vendor: form.vendor,
      licenseNumber: form.licenseNumber.trim().toUpperCase(),
      licenseExpiry: form.licenseExpiry,
    };

    if (form.email.trim()) payload.email = form.email.trim().toLowerCase();
    if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
    if (form.gender) payload.gender = form.gender;
    if (form.currentVehicle) payload.currentVehicle = form.currentVehicle;
    if (form.badgeNumber.trim()) payload.badgeNumber = form.badgeNumber.trim();
    if (form.policeVerificationExpiry) {
      payload.policeVerificationExpiry = form.policeVerificationExpiry;
    }
    if (form.medicalCertificateExpiry) {
      payload.medicalCertificateExpiry = form.medicalCertificateExpiry;
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateDriver(editingId, payload);
        setNotice("Driver updated successfully.");
        setShowForm(false);
      } else {
        const response = await createDriver(payload);
        const result = unwrap(response);
        const token = result?.passwordSetupToken;

        if (token) {
          setPasswordSetupLink(
            `${window.location.origin}/set-password?token=${encodeURIComponent(token)}`
          );
        }

        setNotice(
          token
            ? "Driver created. Copy the password setup link and share it securely with the driver."
            : "Driver created successfully."
        );
        setShowForm(false);
      }

      setEditingId("");
      setForm(EMPTY_FORM);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (driver, status) => {
    setError("");
    setNotice("");

    try {
      await updateDriverStatus(getId(driver), status);
      setNotice("Driver status updated.");
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (driver) => {
    const name = `${driver.firstName || ""} ${driver.lastName || ""}`.trim();

    if (!window.confirm(`Delete driver "${name}"?`)) return;

    setError("");
    setNotice("");

    try {
      await deleteDriver(getId(driver));
      setNotice("Driver deleted successfully.");
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const copySetupLink = async () => {
    try {
      await navigator.clipboard.writeText(passwordSetupLink);
      setNotice("Password setup link copied.");
    } catch {
      setError("Copy failed. Select and copy the password setup link manually.");
    }
  };

  return (
    <section className="management-page">
      <header className="management-page__header">
        <div>
          <p className="management-page__eyebrow">OPERATIONS</p>
          <h1>Driver Management</h1>
          <p>Manage driver profiles, licenses, vendors and vehicle links.</p>
        </div>

        {canManage && (
          <button
            type="button"
            className="management-button management-button--primary"
            onClick={openCreate}
          >
            Add driver
          </button>
        )}
      </header>

      <div className="management-stats">
        <div className="management-stat">
          <span>Total drivers</span>
          <strong>{drivers.length}</strong>
        </div>
        <div className="management-stat">
          <span>Active</span>
          <strong>{drivers.filter((item) => item.status === "ACTIVE").length}</strong>
        </div>
        <div className="management-stat">
          <span>Assigned to a vehicle</span>
          <strong>{drivers.filter((item) => item.currentVehicle).length}</strong>
        </div>
      </div>

      {error && (
        <div className="management-alert management-alert--error" role="alert">
          {error}
          <button type="button" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {notice && (
        <div className="management-alert management-alert--success" role="status">
          {notice}
          <button type="button" onClick={() => setNotice("")}>Dismiss</button>
        </div>
      )}

      {passwordSetupLink && (
        <div className="management-card management-setup-link">
          <strong>Driver password setup link</strong>
          <p>Copy this link and share it securely. It contains a password setup token.</p>
          <input aria-label="Password setup link" readOnly value={passwordSetupLink} onFocus={(event) => event.target.select()} />
          <button type="button" className="management-button management-button--primary" onClick={copySetupLink}>
            Copy setup link
          </button>
        </div>
      )}

      {showForm && (
        <form className="management-card management-form" onSubmit={handleSubmit}>
          <div className="management-card__header">
            <h2>{editingId ? "Edit driver" : "Register driver"}</h2>
            <button type="button" className="management-button" onClick={closeForm}>Close</button>
          </div>

          <div className="management-form__grid">
            <label>
              First name *
              <input name="firstName" value={form.firstName} onChange={handleChange} required maxLength={50} />
            </label>
            <label>
              Last name *
              <input name="lastName" value={form.lastName} onChange={handleChange} required maxLength={50} />
            </label>
            <label>
              Phone *
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input name="email" type="email" value={form.email} onChange={handleChange} />
            </label>
            <label>
              Vendor *
              <select name="vendor" value={form.vendor} onChange={handleChange} required>
                <option value="">Select vendor</option>
                {vendors.filter((vendor) => vendor.status === "ACTIVE").map((vendor) => (
                  <option key={getId(vendor)} value={getId(vendor)}>{vendor.companyName}</option>
                ))}
              </select>
            </label>
            <label>
              Current vehicle
              <select name="currentVehicle" value={form.currentVehicle} onChange={handleChange}>
                <option value="">No vehicle assigned</option>
                {availableVehicles.map((vehicle) => (
                  <option key={getId(vehicle)} value={getId(vehicle)}>{getVehicleLabel(vehicle)}</option>
                ))}
              </select>
            </label>
            <label>
              Date of birth
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
            </label>
            <label>
              Gender
              <select name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Not specified</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </label>
            <label>
              License number *
              <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required maxLength={20} />
            </label>
            <label>
              License expiry *
              <input name="licenseExpiry" type="date" value={form.licenseExpiry} onChange={handleChange} required />
            </label>
            <label>
              Badge number
              <input name="badgeNumber" value={form.badgeNumber} onChange={handleChange} maxLength={30} />
            </label>
            <label>
              Police verification expiry
              <input name="policeVerificationExpiry" type="date" value={form.policeVerificationExpiry} onChange={handleChange} />
            </label>
            <label>
              Medical certificate expiry
              <input name="medicalCertificateExpiry" type="date" value={form.medicalCertificateExpiry} onChange={handleChange} />
            </label>
          </div>

          <div className="management-form__actions">
            <button className="management-button management-button--primary" disabled={saving} type="submit">
              {saving ? "Saving…" : editingId ? "Save changes" : "Create driver"}
            </button>
            <button className="management-button" disabled={saving} onClick={closeForm} type="button">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="management-card">
        <div className="management-toolbar">
          <input
            aria-label="Search drivers"
            placeholder="Search driver, phone, license or vendor…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select aria-label="Filter driver status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="ALL">All statuses</option>
            {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <button type="button" className="management-button" onClick={loadData}>Refresh</button>
        </div>

        {loading ? (
          <div className="management-empty">Loading drivers…</div>
        ) : filteredDrivers.length === 0 ? (
          <div className="management-empty">No drivers found.</div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Contact</th>
                  <th>Vendor</th>
                  <th>Vehicle</th>
                  <th>License expiry</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map((driver) => (
                  <tr key={getId(driver)}>
                    <td>
                      <strong>{`${driver.firstName || ""} ${driver.lastName || ""}`.trim() || "Unnamed driver"}</strong>
                      <small>{driver.licenseNumber || "No license recorded"}</small>
                    </td>
                    <td>
                      <span>{driver.phone || "—"}</span>
                      <small>{driver.email || "No email"}</small>
                    </td>
                    <td>{getVendorName(driver)}</td>
                    <td>
                      {driver.currentVehicle && typeof driver.currentVehicle === "object"
                        ? driver.currentVehicle.vehicleNumber || "Assigned"
                        : driver.currentVehicle ? "Assigned" : "Unassigned"}
                    </td>
                    <td>{toDateInput(driver.licenseExpiry) || "—"}</td>
                    <td>
                      <span className={`management-status management-status--${String(driver.status || "unknown").toLowerCase()}`}>
                        {driver.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td>
                      <div className="management-actions">
                        {canManage && (
                          <>
                            <button type="button" className="management-button" onClick={() => openEdit(driver)}>Edit</button>
                            <select
                              aria-label={`Change status for ${driver.firstName || "driver"}`}
                              value={driver.status || "ACTIVE"}
                              disabled={user?.role === ROLES.DISPATCHER}
                              onChange={(event) => handleStatusChange(driver, event.target.value)}
                            >
                              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                          </>
                        )}
                        {isAdmin && (
                          <button type="button" className="management-button management-button--danger" onClick={() => handleDelete(driver)}>
                            Delete
                          </button>
                        )}
                        {!canManage && <span className="management-muted">View only</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}