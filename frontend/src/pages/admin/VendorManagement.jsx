import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import {
  createVendor,
  deleteVendor,
  getVendors,
  updateVendor,
  updateVendorStatus,
} from "../../api/vendor.api";
import { getApiErrorMessage } from "../../utils/errorHandler";
import { ROLES } from "../../utils/roles";
import "../../styles/management-pages.css";

const EMPTY_FORM = {
  companyName: "",
  ownerName: "",
  email: "",
  phone: "",
  gstNumber: "",
  panNumber: "",
  paymentCycle: "0",
  commissionType: "PERCENTAGE",
  commissionValue: "0",
};

const unwrap = (response) =>
  response?.data?.data ?? response?.data ?? response ?? [];

const getId = (item) =>
  String(item?._id ?? item?.id ?? "");

const STATUS_OPTIONS = ["ACTIVE", "INACTIVE", "SUSPENDED", "BLOCKED"];

export default function VendorManagement() {
  const { user } = useAuth();
  const isAdmin = user?.role === ROLES.ADMIN ||
    user?.role === ROLES.SUPER_ADMIN;

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [editingId, setEditingId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await getVendors();
      const data = unwrap(response);
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const searchable = [
        vendor.companyName,
        vendor.ownerName,
        vendor.email,
        vendor.phone,
        vendor.gstNumber,
        vendor.panNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "ALL" || vendor.status === statusFilter)
      );
    });
  }, [vendors, search, statusFilter]);

  const openCreate = () => {
    setEditingId("");
    setForm(EMPTY_FORM);
    setError("");
    setNotice("");
    setShowForm(true);
  };

  const openEdit = (vendor) => {
    setEditingId(getId(vendor));
    setForm({
      companyName: vendor.companyName || "",
      ownerName: vendor.ownerName || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      gstNumber: vendor.gstNumber || "",
      panNumber: vendor.panNumber || "",
      paymentCycle: String(vendor.paymentCycle ?? 0),
      commissionType: vendor.commissionType || "PERCENTAGE",
      commissionValue: String(vendor.commissionValue ?? 0),
    });
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
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (
      !form.companyName.trim() ||
      !form.ownerName.trim() ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      setError("Company name, owner name, email and phone are required.");
      return;
    }

    const payload = {
      companyName: form.companyName.trim(),
      ownerName: form.ownerName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      paymentCycle: Number(form.paymentCycle || 0),
      commissionType: form.commissionType,
      commissionValue: Number(form.commissionValue || 0),
    };

    if (form.gstNumber.trim()) {
      payload.gstNumber = form.gstNumber.trim().toUpperCase();
    }

    if (form.panNumber.trim()) {
      payload.panNumber = form.panNumber.trim().toUpperCase();
    }

    setSaving(true);

    try {
      if (editingId) {
        await updateVendor(editingId, payload);
        setNotice("Vendor updated successfully.");
      } else {
        await createVendor(payload);
        setNotice("Vendor created successfully.");
      }

      setShowForm(false);
      setEditingId("");
      setForm(EMPTY_FORM);
      await loadVendors();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (vendor, status) => {
    setError("");
    setNotice("");

    try {
      await updateVendorStatus(getId(vendor), status);
      setNotice(`${vendor.companyName}: status updated.`);
      await loadVendors();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const handleDelete = async (vendor) => {
    if (
      !window.confirm(
        `Delete vendor "${vendor.companyName}"? This may be blocked if vehicles or drivers still use this vendor.`
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await deleteVendor(getId(vendor));
      setNotice("Vendor deleted successfully.");
      await loadVendors();
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  return (
    <section className="management-page">
      <header className="management-page__header">
        <div>
          <p className="management-page__eyebrow">OPERATIONS</p>
          <h1>Vendor Management</h1>
          <p>Register and manage transport vendors.</p>
        </div>

        {isAdmin && (
          <button
            className="management-button management-button--primary"
            onClick={openCreate}
            type="button"
          >
            Add vendor
          </button>
        )}
      </header>

      <div className="management-stats">
        <div className="management-stat">
          <span>Total vendors</span>
          <strong>{vendors.length}</strong>
        </div>
        <div className="management-stat">
          <span>Active</span>
          <strong>
            {vendors.filter((item) => item.status === "ACTIVE").length}
          </strong>
        </div>
        <div className="management-stat">
          <span>Inactive / restricted</span>
          <strong>
            {vendors.filter((item) => item.status !== "ACTIVE").length}
          </strong>
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

      {showForm && (
        <form className="management-card management-form" onSubmit={handleSubmit}>
          <div className="management-card__header">
            <h2>{editingId ? "Edit vendor" : "Register vendor"}</h2>
            <button type="button" className="management-button" onClick={closeForm}>
              Close
            </button>
          </div>

          <div className="management-form__grid">
            <label>
              Company name *
              <input name="companyName" value={form.companyName} onChange={handleChange} required maxLength={150} />
            </label>
            <label>
              Owner name *
              <input name="ownerName" value={form.ownerName} onChange={handleChange} required maxLength={100} />
            </label>
            <label>
              Email *
              <input name="email" type="email" value={form.email} onChange={handleChange} required />
            </label>
            <label>
              Phone *
              <input name="phone" type="tel" value={form.phone} onChange={handleChange} required />
            </label>
            <label>
              GST number
              <input name="gstNumber" value={form.gstNumber} onChange={handleChange} maxLength={15} />
            </label>
            <label>
              PAN number
              <input name="panNumber" value={form.panNumber} onChange={handleChange} maxLength={10} />
            </label>
            <label>
              Payment cycle (days)
              <input name="paymentCycle" type="number" min="0" value={form.paymentCycle} onChange={handleChange} />
            </label>
            <label>
              Commission type
              <select name="commissionType" value={form.commissionType} onChange={handleChange}>
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED">Fixed amount</option>
              </select>
            </label>
            <label>
              Commission value
              <input name="commissionValue" type="number" min="0" step="0.01" value={form.commissionValue} onChange={handleChange} />
            </label>
          </div>

          <div className="management-form__actions">
            <button className="management-button management-button--primary" disabled={saving} type="submit">
              {saving ? "Saving…" : editingId ? "Save changes" : "Create vendor"}
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
            aria-label="Search vendors"
            placeholder="Search company, owner, email, phone…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select
            aria-label="Filter vendor status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <button type="button" className="management-button" onClick={loadVendors}>
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="management-empty">Loading vendors…</div>
        ) : filteredVendors.length === 0 ? (
          <div className="management-empty">No vendors found.</div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Owner</th>
                  <th>Contact</th>
                  <th>Payment cycle</th>
                  <th>Commission</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredVendors.map((vendor) => (
                  <tr key={getId(vendor)}>
                    <td>
                      <strong>{vendor.companyName}</strong>
                      <small>{vendor.gstNumber || "No GST recorded"}</small>
                    </td>
                    <td>{vendor.ownerName || "—"}</td>
                    <td>
                      <span>{vendor.email || "—"}</span>
                      <small>{vendor.phone || "—"}</small>
                    </td>
                    <td>{vendor.paymentCycle ?? 0} days</td>
                    <td>
                      {vendor.commissionType === "PERCENTAGE" ? `${vendor.commissionValue ?? 0}%` : `₹${vendor.commissionValue ?? 0}`}
                    </td>
                    <td>
                      <span className={`management-status management-status--${String(vendor.status || "unknown").toLowerCase()}`}>
                        {vendor.status || "UNKNOWN"}
                      </span>
                    </td>
                    <td>
                      <div className="management-actions">
                        {isAdmin && (
                          <>
                            <button type="button" className="management-button" onClick={() => openEdit(vendor)}>Edit</button>
                            <select
                              aria-label={`Change status for ${vendor.companyName}`}
                              value={vendor.status || "ACTIVE"}
                              onChange={(event) => handleStatusChange(vendor, event.target.value)}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                            <button type="button" className="management-button management-button--danger" onClick={() => handleDelete(vendor)}>Delete</button>
                          </>
                        )}
                        {!isAdmin && <span className="management-muted">View only</span>}
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