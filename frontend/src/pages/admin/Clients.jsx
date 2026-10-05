import React, { useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  RotateCcw,
  Power,
  Building2,
  Users,
  UserCheck,
  UserX,
  X,
  Save,
} from "lucide-react";

const STATUS_OPTIONS = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "BLOCKED",
];

const EMPTY_FORM = {
  companyName: "",
  email: "",
  phone: "",
  gstNumber: "",
  panNumber: "",
  industry: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  agreementStartDate: "",
  agreementEndDate: "",
  paymentTerms: 30,
  creditLimit: 0,
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

function getInitials(name) {
  if (!name) return "CL";

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [deletedClients, setDeletedClients] = useState([]);

  const [activeTab, setActiveTab] = useState("active");

  const [loading, setLoading] = useState(true);
  const [deletedLoading, setDeletedLoading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);

  const loadActiveClients = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.request("/clients", {
        method: "GET",
      });

      setClients(
        extractRecords(response, ["clients", "results"])
      );
    } catch (err) {
      console.error("Failed to load clients:", err);
      setError(err.message || "Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  const loadDeletedClients = async () => {
    try {
      setDeletedLoading(true);
      setError("");

      const response = await api.request("/clients?isDeleted=true", {
        method: "GET",
      });

      setDeletedClients(
        extractRecords(response, ["clients", "results"])
      );
    } catch (err) {
      console.error("Failed to load deleted clients:", err);
      setError(err.message || "Failed to load deleted clients.");
    } finally {
      setDeletedLoading(false);
    }
  };

  const loadClients = async () => {
    await loadActiveClients();

    if (activeTab === "deleted") {
      await loadDeletedClients();
    }
  };

  useEffect(() => {
    loadActiveClients();
    loadDeletedClients();
  }, []);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess("");
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [success]);

  const activeCount = useMemo(
    () =>
      clients.filter(
        (client) => client.status === "ACTIVE"
      ).length,
    [clients]
  );

  const inactiveCount = useMemo(
    () =>
      clients.filter(
        (client) => client.status !== "ACTIVE"
      ).length,
    [clients]
  );

  const filteredClients = useMemo(() => {
    const source =
      activeTab === "deleted" ? deletedClients : clients;

    const query = search.trim().toLowerCase();

    return source.filter((client) => {
      const matchesSearch =
        !query ||
        client.companyName?.toLowerCase().includes(query) ||
        client.email?.toLowerCase().includes(query) ||
        client.phone?.toLowerCase().includes(query) ||
        client.gstNumber?.toLowerCase().includes(query) ||
        client.city?.toLowerCase().includes(query);

      const matchesStatus =
        activeTab === "deleted" ||
        statusFilter === "ALL" ||
        client.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    activeTab,
    clients,
    deletedClients,
    search,
    statusFilter,
  ]);

  const openAddModal = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (client) => {
    setEditingClient(client);

    setForm({
      companyName: client.companyName || "",
      email: client.email || "",
      phone: client.phone || "",
      gstNumber: client.gstNumber || "",
      panNumber: client.panNumber || "",
      industry: client.industry || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      country: client.country || "India",
      pincode: client.pincode || "",
      agreementStartDate: client.agreementStartDate
        ? client.agreementStartDate.substring(0, 10)
        : "",
      agreementEndDate: client.agreementEndDate
        ? client.agreementEndDate.substring(0, 10)
        : "",
      paymentTerms:
        client.paymentTerms !== undefined
          ? client.paymentTerms
          : 30,
      creditLimit:
        client.creditLimit !== undefined
          ? client.creditLimit
          : 0,
    });

    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingClient(null);
    setForm(EMPTY_FORM);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const buildPayload = () => {
    const payload = {
      companyName: form.companyName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      country: form.country.trim() || "India",
    };

    const optionalFields = [
      "gstNumber",
      "panNumber",
      "industry",
      "address",
      "city",
      "state",
      "pincode",
    ];

    optionalFields.forEach((field) => {
      const value = form[field]?.trim();

      if (value) {
        payload[field] = value;
      }
    });

    if (form.agreementStartDate) {
      payload.agreementStartDate = form.agreementStartDate;
    }

    if (form.agreementEndDate) {
      payload.agreementEndDate = form.agreementEndDate;
    }

    if (form.paymentTerms !== "") {
      payload.paymentTerms = Number(form.paymentTerms);
    }

    if (form.creditLimit !== "") {
      payload.creditLimit = Number(form.creditLimit);
    }

    return payload;
  };

  const validateForm = () => {
    if (!form.companyName.trim()) {
      return "Company name is required.";
    }

    if (!form.email.trim()) {
      return "Email is required.";
    }

    if (!form.phone.trim()) {
      return "Phone number is required.";
    }

    if (
      form.agreementStartDate &&
      form.agreementEndDate &&
      new Date(form.agreementEndDate) <
        new Date(form.agreementStartDate)
    ) {
      return "Agreement end date cannot be before the start date.";
    }

    if (
      form.paymentTerms !== "" &&
      Number(form.paymentTerms) < 0
    ) {
      return "Payment terms cannot be negative.";
    }

    if (
      form.creditLimit !== "" &&
      Number(form.creditLimit) < 0
    ) {
      return "Credit limit cannot be negative.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = buildPayload();

      if (editingClient) {
        await api.request(
          `/clients/${editingClient._id || editingClient.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        setSuccess("Client updated successfully.");
      } else {
        await api.request("/clients", {
          method: "POST",
          body: JSON.stringify(payload),
        });

        setSuccess("Client created successfully.");
      }

      closeModal();

      await loadActiveClients();
    } catch (err) {
      console.error("Failed to save client:", err);
      setError(err.message || "Failed to save client.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (client, status) => {
    const clientId = client._id || client.id;

    try {
      setActionId(clientId);
      setError("");

      await api.request(`/clients/${clientId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          status,
        }),
      });

      setSuccess(
        `Client ${status === "ACTIVE" ? "activated" : "deactivated"} successfully.`
      );

      await loadActiveClients();
    } catch (err) {
      console.error("Failed to update client status:", err);
      setError(
        err.message || "Failed to update client status."
      );
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (client) => {
    const clientId = client._id || client.id;

    const confirmed = window.confirm(
      `Soft delete "${client.companyName}"?\n\n` +
        `The client will be removed from the active client list, ` +
        `but it will NOT be permanently deleted. ` +
        `You can restore it later from the Deleted Clients section.\n\n` +
        `Clients with existing events cannot be deleted.`
    );

    if (!confirmed) return;

    try {
      setActionId(clientId);
      setError("");

      await api.request(`/clients/${clientId}`, {
        method: "DELETE",
      });

      setSuccess(
        "Client soft-deleted successfully. You can restore it from Deleted Clients."
      );

      await loadActiveClients();
      await loadDeletedClients();
    } catch (err) {
      console.error("Failed to delete client:", err);
      setError(err.message || "Failed to delete client.");
    } finally {
      setActionId(null);
    }
  };

  const handleRestore = async (client) => {
    const clientId = client._id || client.id;

    const confirmed = window.confirm(
      `Restore "${client.companyName}"?\n\n` +
        `The client will become active again and will return to the All Clients list.`
    );

    if (!confirmed) return;

    try {
      setActionId(clientId);
      setError("");

      await api.request(`/clients/${clientId}/restore`, {
        method: "PATCH",
      });

      setSuccess(
        "Client restored successfully. It is active again."
      );

      await loadActiveClients();
      await loadDeletedClients();
    } catch (err) {
      console.error("Failed to restore client:", err);
      setError(err.message || "Failed to restore client.");
    } finally {
      setActionId(null);
    }
  };

  const handleRefresh = async () => {
    setError("");

    await loadActiveClients();
    await loadDeletedClients();

    setSuccess("Client list refreshed.");
  };

  return (
    <div className="page">
      <section className="hero">
        <div className="head">
          <div>
            <div className="eyebrow">ADMINISTRATION</div>

            <h1>Clients</h1>

            <p className="muted">
              Manage corporate clients, account status and
              client portal access.
            </p>
          </div>

          <div className="hero-actions">
            <button
              className="btn secondary"
              onClick={handleRefresh}
              disabled={loading || deletedLoading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              className="btn primary"
              onClick={openAddModal}
            >
              <Plus size={16} />
              Add Client
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
              <div className="stat-label">Total Clients</div>
              <strong>{clients.length}</strong>
            </div>

            <div className="stat-icon">
              <Building2 size={20} />
            </div>
          </div>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div>
              <div className="stat-label">Active</div>
              <strong>{activeCount}</strong>
            </div>

            <div className="stat-icon">
              <UserCheck size={20} />
            </div>
          </div>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div>
              <div className="stat-label">Inactive</div>
              <strong>{inactiveCount}</strong>
            </div>

            <div className="stat-icon">
              <UserX size={20} />
            </div>
          </div>
        </div>

        <div className="stat">
          <div className="stat-top">
            <div>
              <div className="stat-label">Deleted</div>
              <strong>{deletedClients.length}</strong>
            </div>

            <div className="stat-icon">
              <Trash2 size={20} />
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="tabs">
          <button
            className={`tab ${
              activeTab === "active" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("active");
              setSearch("");
            }}
          >
            All Clients
            <span className="pill">{clients.length}</span>
          </button>

          <button
            className={`tab ${
              activeTab === "deleted" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("deleted");
              setSearch("");
            }}
          >
            Deleted Clients
            <span className="pill">
              {deletedClients.length}
            </span>
          </button>
        </div>

        <div className="toolbar">
          <div className="search">
            <Search size={17} />

            <input
              type="text"
              placeholder={
                activeTab === "deleted"
                  ? "Search deleted clients..."
                  : "Search clients..."
              }
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          {activeTab === "active" && (
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">All statuses</option>

              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          )}
        </div>

        {(loading && activeTab === "active") ||
        (deletedLoading && activeTab === "deleted") ? (
          <div className="empty">
            <div className="spin" />
            <p>Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="empty">
            {activeTab === "deleted" ? (
              <>
                <Trash2 size={32} />

                <h3>No deleted clients</h3>

                <p>
                  Soft-deleted clients will appear here and
                  can be restored.
                </p>
              </>
            ) : (
              <>
                <Users size={32} />

                <h3>No clients found</h3>

                <p>
                  Try changing your search or add a new
                  client.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>
                    {activeTab === "deleted"
                      ? "Deleted On"
                      : "Agreement"}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.map((client) => {
                  const clientId =
                    client._id || client.id;

                  const isBusy = actionId === clientId;

                  return (
                    <tr key={clientId}>
                      <td>
                        <div className="event-row">
                          <div className="event-avatar">
                            {getInitials(
                              client.companyName
                            )}
                          </div>

                          <div className="event-main">
                            <strong>
                              {client.companyName}
                            </strong>

                            {client.industry && (
                              <span className="muted">
                                {client.industry}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div>
                          <strong>
                            {client.email || "—"}
                          </strong>

                          <div className="muted">
                            {client.phone || "—"}
                          </div>
                        </div>
                      </td>

                      <td>
                        {[
                          client.city,
                          client.state,
                        ]
                          .filter(Boolean)
                          .join(", ") || "—"}
                      </td>

                      <td>
                        {activeTab === "deleted" ? (
                          <span className="pill">
                            DELETED
                          </span>
                        ) : (
                          <span
                            className={`pill ${
                              client.status === "ACTIVE"
                                ? "success"
                                : ""
                            }`}
                          >
                            {client.status || "UNKNOWN"}
                          </span>
                        )}
                      </td>

                      <td>
                        {activeTab === "deleted" ? (
                          formatDate(client.deletedAt)
                        ) : (
                          <div>
                            <div>
                              {formatDate(
                                client.agreementStartDate
                              )}
                            </div>

                            <div className="muted">
                              to{" "}
                              {formatDate(
                                client.agreementEndDate
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="table-actions">
                          {activeTab === "deleted" ? (
                            <button
                              className="btn small secondary"
                              onClick={() =>
                                handleRestore(client)
                              }
                              disabled={isBusy}
                              title="Restore client"
                            >
                              <RotateCcw size={15} />

                              {isBusy
                                ? "Restoring..."
                                : "Restore"}
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn small secondary"
                                onClick={() =>
                                  openEditModal(client)
                                }
                                disabled={isBusy}
                                title="Edit client"
                              >
                                <Pencil size={15} />
                              </button>

                              {client.status === "ACTIVE" ? (
                                <button
                                  className="btn small secondary"
                                  onClick={() =>
                                    handleStatusChange(
                                      client,
                                      "INACTIVE"
                                    )
                                  }
                                  disabled={isBusy}
                                  title="Deactivate client"
                                >
                                  <Power size={15} />
                                </button>
                              ) : (
                                <button
                                  className="btn small secondary"
                                  onClick={() =>
                                    handleStatusChange(
                                      client,
                                      "ACTIVE"
                                    )
                                  }
                                  disabled={isBusy}
                                  title="Activate client"
                                >
                                  <Power size={15} />
                                </button>
                              )}

                              <button
                                className="btn small danger"
                                onClick={() =>
                                  handleDelete(client)
                                }
                                disabled={isBusy}
                                title="Soft delete client"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showModal && (
        <div className="overlay">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  CLIENT MANAGEMENT
                </div>

                <h2>
                  {editingClient
                    ? "Edit Client"
                    : "Add Client"}
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
                Basic Information
              </div>

              <div className="form-grid">
                <label>
                  Company Name *
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="Company name"
                  />
                </label>

                <label>
                  Email *
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="company@example.com"
                  />
                </label>

                <label>
                  Phone *
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone number"
                  />
                </label>

                <label>
                  Industry
                  <input
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    placeholder="IT, Manufacturing..."
                  />
                </label>

                <label>
                  GST Number
                  <input
                    name="gstNumber"
                    value={form.gstNumber}
                    onChange={handleChange}
                    placeholder="GST number"
                  />
                </label>

                <label>
                  PAN Number
                  <input
                    name="panNumber"
                    value={form.panNumber}
                    onChange={handleChange}
                    placeholder="PAN number"
                  />
                </label>
              </div>

              <div className="form-section-title">
                Address
              </div>

              <div className="form-grid">
                <label className="full-width">
                  Address
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Full address"
                  />
                </label>

                <label>
                  City
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </label>

                <label>
                  State
                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="State"
                  />
                </label>

                <label>
                  Country
                  <input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </label>

                <label>
                  Pincode
                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="Pincode"
                  />
                </label>
              </div>

              <div className="form-section-title">
                Agreement & Billing
              </div>

              <div className="form-grid">
                <label>
                  Agreement Start
                  <input
                    type="date"
                    name="agreementStartDate"
                    value={form.agreementStartDate}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Agreement End
                  <input
                    type="date"
                    name="agreementEndDate"
                    value={form.agreementEndDate}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Payment Terms (days)
                  <input
                    type="number"
                    min="0"
                    name="paymentTerms"
                    value={form.paymentTerms}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Credit Limit
                  <input
                    type="number"
                    min="0"
                    name="creditLimit"
                    value={form.creditLimit}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn primary"
                  disabled={saving}
                >
                  <Save size={16} />

                  {saving
                    ? "Saving..."
                    : editingClient
                    ? "Update Client"
                    : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}