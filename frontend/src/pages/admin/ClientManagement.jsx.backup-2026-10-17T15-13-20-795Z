import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../auth/AuthContext";

import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  restoreClient,
  updateClient,
  updateClientStatus,
} from "../../api/client.api";

import { getApiErrorMessage } from "../../utils/errorHandler";
import { ROLES } from "../../utils/roles";

import "../../styles/client-management.css";

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

const extractData = (response) => {
  return response?.data ?? response ?? [];
};

const getId = (client) => {
  return client?._id || client?.id;
};

const toDateInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const normalizeClientForForm = (client) => ({
  companyName: client?.companyName || "",
  email: client?.email || "",
  phone: client?.phone || "",
  gstNumber: client?.gstNumber || "",
  panNumber: client?.panNumber || "",
  industry: client?.industry || "",
  address: client?.address || "",
  city: client?.city || "",
  state: client?.state || "",
  country: client?.country || "India",
  pincode: client?.pincode || "",
  agreementStartDate: toDateInput(
    client?.agreementStartDate
  ),
  agreementEndDate: toDateInput(
    client?.agreementEndDate
  ),
  paymentTerms: client?.paymentTerms ?? 30,
  creditLimit: client?.creditLimit ?? 0,
});

const buildPayload = (form) => {
  const payload = {
    ...form,
    paymentTerms:
      form.paymentTerms === ""
        ? 0
        : Number(form.paymentTerms),
    creditLimit:
      form.creditLimit === ""
        ? 0
        : Number(form.creditLimit),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") {
      delete payload[key];
    }
  });

  return payload;
};

function ClientManagement() {
  const { user } = useAuth();

  const canManage =
    user?.role === ROLES.ADMIN;

  const [activeTab, setActiveTab] =
    useState("active");

  const [clients, setClients] =
    useState([]);

  const [deletedClients, setDeletedClients] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");

  const [modal, setModal] =
    useState(null);

  const [selectedClient, setSelectedClient] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [detailsLoading, setDetailsLoading] =
    useState(false);

  const loadClients = async () => {
    setLoading(true);
    setError("");

    try {
      const activeResponse =
        await getClients();

      let deletedResponse = {
        data: [],
      };

      if (canManage) {
        deletedResponse =
          await getClients({
            isDeleted: true,
          });
      }

      setClients(
        extractData(activeResponse)
      );

      setDeletedClients(
        extractData(deletedResponse)
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load clients."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [canManage]);

  const visibleClients = useMemo(() => {
    const source =
      activeTab === "deleted"
        ? deletedClients
        : clients;

    const query =
      search.trim().toLowerCase();

    if (!query) {
      return source;
    }

    return source.filter((client) =>
      [
        client.companyName,
        client.email,
        client.phone,
        client.city,
        client.state,
        client.industry,
        client.gstNumber,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        )
    );
  }, [
    activeTab,
    clients,
    deletedClients,
    search,
  ]);

  const closeModal = () => {
    if (actionLoading) {
      return;
    }

    setModal(null);
    setSelectedClient(null);
    setForm(EMPTY_FORM);
  };

  const openCreate = () => {
    setError("");
    setNotice("");

    setSelectedClient(null);
    setForm(EMPTY_FORM);

    setModal("form");
  };

  const openEdit = (client) => {
    setError("");
    setNotice("");

    setSelectedClient(client);
    setForm(
      normalizeClientForForm(client)
    );

    setModal("form");
  };

  const openDetails = async (client) => {
    setModal("details");
    setDetailsLoading(true);
    setSelectedClient(client);

    try {
      const response =
        await getClientById(
          getId(client)
        );

      setSelectedClient(
        extractData(response)
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to load client details."
        )
      );

      setModal(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
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
      form.agreementEndDate
    ) {
      if (
        new Date(
          form.agreementEndDate
        ) <
        new Date(
          form.agreementStartDate
        )
      ) {
        return (
          "Agreement end date cannot be " +
          "before its start date."
        );
      }
    }

    if (Number(form.creditLimit) < 0) {
      return "Credit limit cannot be negative.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      if (selectedClient) {
        await updateClient(
          getId(selectedClient),
          buildPayload(form)
        );

        setNotice(
          "Client updated successfully."
        );
      } else {
        const response =
          await createClient(
            buildPayload(form)
          );

        const data =
          extractData(response);

        if (data?.portalAccount?.created) {
          setNotice(
            "Client created successfully. " +
            "The backend generated a portal " +
            "password setup token."
          );
        } else {
          setNotice(
            "Client created successfully."
          );
        }
      }

      setModal(null);
      setSelectedClient(null);
      setForm(EMPTY_FORM);

      await loadClients();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to save client."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (client) => {
    const confirmed = window.confirm(
      `Delete ${client.companyName}? This is a soft delete and the client can be restored later.`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await deleteClient(
        getId(client)
      );

      setNotice(
        "Client deleted successfully."
      );

      await loadClients();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to delete client."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (client) => {
    const confirmed = window.confirm(
      `Restore ${client.companyName}?`
    );

    if (!confirmed) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await restoreClient(
        getId(client)
      );

      setNotice(
        "Client restored successfully."
      );

      await loadClients();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to restore client."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (
    client,
    status
  ) => {
    if (client.status === status) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      await updateClientStatus(
        getId(client),
        status
      );

      setNotice(
        `Client status changed to ${status}.`
      );

      await loadClients();
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Unable to update client status."
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <section className="client-management">
      <div className="client-page-header">
        <div>
          <span className="client-eyebrow">
            Master Data
          </span>

          <h1>Client Management</h1>

          <p>
            Manage client companies,
            agreements, billing terms and
            portal access.
          </p>
        </div>

        {canManage && (
          <button
            className="client-primary-btn"
            onClick={openCreate}
          >
            + Add Client
          </button>
        )}
      </div>

      {error && (
        <div className="client-alert client-alert--error">
          <strong>Error</strong>

          <span>{error}</span>

          <button
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {notice && (
        <div className="client-alert client-alert--success">
          <strong>Success</strong>

          <span>{notice}</span>

          <button
            onClick={() => setNotice("")}
          >
            ×
          </button>
        </div>
      )}

      <div className="client-toolbar">
        <div className="client-tabs">
          <button
            className={
              activeTab === "active"
                ? "client-tab client-tab--active"
                : "client-tab"
            }
            onClick={() =>
              setActiveTab("active")
            }
          >
            Active Clients{" "}
            <span>{clients.length}</span>
          </button>

          {canManage && (
            <button
              className={
                activeTab === "deleted"
                  ? "client-tab client-tab--active"
                  : "client-tab"
              }
              onClick={() =>
                setActiveTab("deleted")
              }
            >
              Deleted{" "}
              <span>
                {deletedClients.length}
              </span>
            </button>
          )}
        </div>

        <div className="client-search">
          <span>⌕</span>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search company, email, phone, city..."
          />
        </div>
      </div>

      <div className="client-summary-row">
        <div>
          <span>Total shown</span>
          <strong>
            {visibleClients.length}
          </strong>
        </div>

        <div>
          <span>Active</span>
          <strong>
            {
              clients.filter(
                (client) =>
                  client.status ===
                  "ACTIVE"
              ).length
            }
          </strong>
        </div>

        <div>
          <span>Inactive / Other</span>
          <strong>
            {
              clients.filter(
                (client) =>
                  client.status !==
                  "ACTIVE"
              ).length
            }
          </strong>
        </div>

        {canManage && (
          <div>
            <span>Deleted</span>
            <strong>
              {deletedClients.length}
            </strong>
          </div>
        )}
      </div>

      {loading ? (
        <div className="client-loading">
          <div className="client-spinner" />
          <p>Loading clients...</p>
        </div>
      ) : visibleClients.length === 0 ? (
        <div className="client-empty">
          <div className="client-empty__icon">
            ◎
          </div>

          <h2>
            {activeTab === "deleted"
              ? "No deleted clients"
              : "No clients found"}
          </h2>

          <p>
            {search
              ? "Try a different search term."
              : activeTab === "deleted"
                ? "Soft-deleted clients will appear here."
                : "Create your first client to start managing client data."}
          </p>

          {canManage &&
            activeTab === "active" &&
            !search && (
              <button
                className="client-primary-btn"
                onClick={openCreate}
              >
                Add your first client
              </button>
            )}
        </div>
      ) : (
        <div className="client-table-card">
          <div className="client-table-wrapper">
            <table className="client-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Contact</th>
                  <th>Location</th>
                  <th>Agreement</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {visibleClients.map(
                  (client) => (
                    <tr
                      key={getId(client)}
                    >
                      <td>
                        <strong>
                          {client.companyName}
                        </strong>

                        <small>
                          {client.industry ||
                            "Industry not specified"}
                        </small>
                      </td>

                      <td>
                        <span>
                          {client.email}
                        </span>

                        <small>
                          {client.phone}
                        </small>
                      </td>

                      <td>
                        <span>
                          {client.city || "—"}
                        </span>

                        <small>
                          {client.state ||
                            client.country ||
                            "—"}
                        </small>
                      </td>

                      <td>
                        <span>
                          {formatDate(
                            client.agreementStartDate
                          )}
                        </span>

                        <small>
                          to{" "}
                          {formatDate(
                            client.agreementEndDate
                          )}
                        </small>
                      </td>

                      <td>
                        {activeTab ===
                        "deleted" ? (
                          <span className="client-status client-status--deleted">
                            DELETED
                          </span>
                        ) : canManage ? (
                          <select
                            className={`client-status-select client-status-select--${String(
                              client.status || ""
                            ).toLowerCase()}`}
                            value={
                              client.status ||
                              "ACTIVE"
                            }
                            onChange={(
                              event
                            ) =>
                              handleStatusChange(
                                client,
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              actionLoading
                            }
                          >
                            {STATUS_OPTIONS.map(
                              (status) => (
                                <option
                                  key={status}
                                  value={status}
                                >
                                  {status}
                                </option>
                              )
                            )}
                          </select>
                        ) : (
                          <span
                            className={`client-status client-status--${String(
                              client.status || ""
                            ).toLowerCase()}`}
                          >
                            {client.status ||
                              "UNKNOWN"}
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="client-actions">
                          <button
                            className="client-action-btn"
                            onClick={() =>
                              openDetails(
                                client
                              )
                            }
                          >
                            View
                          </button>

                          {activeTab ===
                            "deleted" &&
                          canManage ? (
                            <button
                              className="client-action-btn client-action-btn--restore"
                              onClick={() =>
                                handleRestore(
                                  client
                                )
                              }
                              disabled={
                                actionLoading
                              }
                            >
                              Restore
                            </button>
                          ) : canManage ? (
                            <>
                              <button
                                className="client-action-btn"
                                onClick={() =>
                                  openEdit(
                                    client
                                  )
                                }
                              >
                                Edit
                              </button>

                              <button
                                className="client-action-btn client-action-btn--danger"
                                onClick={() =>
                                  handleDelete(
                                    client
                                  )
                                }
                                disabled={
                                  actionLoading
                                }
                              >
                                Delete
                              </button>
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal === "form" && (
        <div
          className="client-modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="client-modal client-modal--large"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="client-modal__header">
              <div>
                <span className="client-eyebrow">
                  Client
                </span>

                <h2>
                  {selectedClient
                    ? "Edit Client"
                    : "Add Client"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="client-modal__close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="client-form-grid">
                <Field
                  label="Company Name"
                  name="companyName"
                  value={form.companyName}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                />

                <Field
                  label="Industry"
                  name="industry"
                  value={form.industry}
                  onChange={handleChange}
                />

                <Field
                  label="GST Number"
                  name="gstNumber"
                  value={form.gstNumber}
                  onChange={handleChange}
                />

                <Field
                  label="PAN Number"
                  name="panNumber"
                  value={form.panNumber}
                  onChange={handleChange}
                />

                <Field
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                />

                <Field
                  label="State"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                />

                <Field
                  label="Country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                />

                <Field
                  label="Pincode"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                />

                <Field
                  label="Agreement Start"
                  name="agreementStartDate"
                  type="date"
                  value={
                    form.agreementStartDate
                  }
                  onChange={handleChange}
                />

                <Field
                  label="Agreement End"
                  name="agreementEndDate"
                  type="date"
                  value={
                    form.agreementEndDate
                  }
                  onChange={handleChange}
                />

                <Field
                  label="Payment Terms (days)"
                  name="paymentTerms"
                  type="number"
                  min="0"
                  value={
                    form.paymentTerms
                  }
                  onChange={handleChange}
                />

                <Field
                  label="Credit Limit"
                  name="creditLimit"
                  type="number"
                  min="0"
                  value={
                    form.creditLimit
                  }
                  onChange={handleChange}
                />

                <div className="client-field client-field--full">
                  <label htmlFor="address">
                    Address
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows="3"
                  />
                </div>
              </div>

              <div className="client-modal__footer">
                <button
                  type="button"
                  className="client-secondary-btn"
                  onClick={closeModal}
                  disabled={
                    actionLoading
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="client-primary-btn"
                  disabled={
                    actionLoading
                  }
                >
                  {actionLoading
                    ? "Saving..."
                    : selectedClient
                      ? "Save Changes"
                      : "Create Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "details" && (
        <div
          className="client-modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="client-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="client-modal__header">
              <div>
                <span className="client-eyebrow">
                  Client Profile
                </span>

                <h2>
                  {selectedClient?.companyName ||
                    "Client Details"}
                </h2>
              </div>

              <button
                onClick={closeModal}
                className="client-modal__close"
              >
                ×
              </button>
            </div>

            {detailsLoading ? (
              <div className="client-loading client-loading--compact">
                <div className="client-spinner" />

                <p>
                  Loading details...
                </p>
              </div>
            ) : (
              <div className="client-details">
                <Detail
                  label="Company"
                  value={
                    selectedClient?.companyName
                  }
                />

                <Detail
                  label="Email"
                  value={
                    selectedClient?.email
                  }
                />

                <Detail
                  label="Phone"
                  value={
                    selectedClient?.phone
                  }
                />

                <Detail
                  label="Industry"
                  value={
                    selectedClient?.industry
                  }
                />

                <Detail
                  label="GST Number"
                  value={
                    selectedClient?.gstNumber
                  }
                />

                <Detail
                  label="PAN Number"
                  value={
                    selectedClient?.panNumber
                  }
                />

                <Detail
                  label="Address"
                  value={
                    selectedClient?.address
                  }
                />

                <Detail
                  label="City"
                  value={
                    selectedClient?.city
                  }
                />

                <Detail
                  label="State"
                  value={
                    selectedClient?.state
                  }
                />

                <Detail
                  label="Country"
                  value={
                    selectedClient?.country
                  }
                />

                <Detail
                  label="Pincode"
                  value={
                    selectedClient?.pincode
                  }
                />

                <Detail
                  label="Payment Terms"
                  value={
                    selectedClient?.paymentTerms
                      ? `${selectedClient.paymentTerms} days`
                      : "—"
                  }
                />

                <Detail
                  label="Credit Limit"
                  value={
                    selectedClient?.creditLimit ??
                    "—"
                  }
                />

                <Detail
                  label="Agreement Start"
                  value={formatDate(
                    selectedClient?.agreementStartDate
                  )}
                />

                <Detail
                  label="Agreement End"
                  value={formatDate(
                    selectedClient?.agreementEndDate
                  )}
                />

                <Detail
                  label="Status"
                  value={
                    selectedClient?.status
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  value,
  onChange,
  required = false,
  min,
}) {
  return (
    <div className="client-field">
      <label htmlFor={name}>
        {label}{" "}
        {required && (
          <span>*</span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
      />
    </div>
  );
}

function Detail({
  label,
  value,
}) {
  return (
    <div className="client-detail">
      <span>{label}</span>

      <strong>
        {value || "—"}
      </strong>
    </div>
  );
}

export default ClientManagement;