import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import api from "../../services/api";

const STATUS_OPTIONS = [
  "ACTIVE",
  "INACTIVE",
  "AVAILABLE",
  "ON_DUTY",
  "MAINTENANCE",
  "SUSPENDED",
];

function getArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  return [];
}

function getError(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.msg ||
    error?.message ||
    fallback
  );
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "object") {
    return (
      value.name ||
      value.companyName ||
      value.firstName ||
      value.eventCode ||
      value.locationCode ||
      value.vehicleNumber ||
      "—"
    );
  }

  return String(value);
}

function getStatusClass(status) {
  if (
    [
      "ACTIVE",
      "AVAILABLE",
      "ON_DUTY",
      "CONFIRMED",
    ].includes(status)
  ) {
    return "success";
  }

  if (
    [
      "INACTIVE",
      "SUSPENDED",
      "CANCELLED",
      "MAINTENANCE",
    ].includes(status)
  ) {
    return "danger";
  }

  return "warning";
}

function formatLabel(value) {
  return String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
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

function StatCard({ label, value, description }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className="stat-label">{label}</span>
      </div>

      <div className="stat-value">{value}</div>

      <div className="muted">
        {description}
      </div>
    </div>
  );
}

export default function AdminResourcePage({
  title,
  description,
  endpoint,
  fields,
  columns,
  searchFields,
  statusField = "status",
  deleteEnabled = true,
  statusEnabled = true,
  dependencies = [],
}) {
  const [records, setRecords] = useState([]);
  const [dependencyData, setDependencyData] =
    useState({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("ALL");

  const [modalOpen, setModalOpen] =
    useState(false);
  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [editingRecord, setEditingRecord] =
    useState(null);
  const [selectedRecord, setSelectedRecord] =
    useState(null);

  const [form, setForm] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const emptyForm = useMemo(() => {
    const value = {};

    fields.forEach((field) => {
      value[field.name] =
        field.defaultValue !== undefined
          ? field.defaultValue
          : "";
    });

    return value;
  }, [fields]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const requests = [
        api.request(endpoint),
        ...dependencies.map((dependency) =>
          api.request(dependency.endpoint)
        ),
      ];

      const results =
        await Promise.all(requests);

      setRecords(getArray(results[0]));

      const dependencyResult = {};

      dependencies.forEach(
        (dependency, index) => {
          dependencyResult[
            dependency.name
          ] = getArray(results[index + 1]);
        }
      );

      setDependencyData(dependencyResult);
    } catch (requestError) {
      setError(
        getError(
          requestError,
          `Unable to load ${title.toLowerCase()}.`
        )
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [endpoint]);

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => clearTimeout(timer);
  }, [success]);

  const filteredRecords = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        !query ||
        searchFields.some((field) =>
          displayValue(
            record[field]
          )
            .toLowerCase()
            .includes(query)
        );

      const matchesStatus =
        statusFilter === "ALL" ||
        record[statusField] === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    records,
    search,
    statusFilter,
    searchFields,
    statusField,
  ]);

  const activeCount = records.filter(
    (record) =>
      !record.isDeleted &&
      (
        record[statusField] === "ACTIVE" ||
        record[statusField] === "AVAILABLE"
      )
  ).length;

  const inactiveCount =
    records.length - activeCount;

  const openCreate = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEdit = (record) => {
    const values = {};

    fields.forEach((field) => {
      let value = record[field.name];

      if (
        field.type === "date" &&
        value
      ) {
        value = String(value).slice(0, 10);
      }

      if (
        field.type === "datetime-local" &&
        value
      ) {
        const date = new Date(value);

        value = Number.isNaN(date.getTime())
          ? ""
          : new Date(
              date.getTime() -
                date.getTimezoneOffset() *
                  60000
            )
              .toISOString()
              .slice(0, 16);
      }

      if (
        field.objectId &&
        typeof value === "object"
      ) {
        value = value?._id || "";
      }

      values[field.name] =
        value ?? "";
    });

    setEditingRecord(record);
    setForm(values);
    setError("");
    setModalOpen(true);
  };

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingRecord(null);
    setForm(emptyForm);
  };

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const payload = {};

    fields.forEach((field) => {
      let value = form[field.name];

      if (
        typeof value === "string"
      ) {
        value = value.trim();
      }

      if (
        field.type === "number" &&
        value !== ""
      ) {
        value = Number(value);
      }

      if (
        field.type === "checkbox"
      ) {
        value = Boolean(value);
      }

      if (
        field.optional &&
        (value === "" ||
          value === undefined)
      ) {
        return;
      }

      payload[field.name] = value;
    });

    setSaving(true);

    try {
      if (editingRecord) {
        await api.request(
          `${endpoint}/${editingRecord._id}`,
          {
            method: "PUT",
            body: payload,
          }
        );

        setSuccess(
          `${title.slice(
            0,
            -1
          )} updated successfully.`
        );
      } else {
        await api.request(endpoint, {
          method: "POST",
          body: payload,
        });

        setSuccess(
          `${title.slice(
            0,
            -1
          )} created successfully.`
        );
      }

      closeModal();
      await loadData();
    } catch (requestError) {
      setError(
        getError(
          requestError,
          `Unable to save ${title.toLowerCase()}.`
        )
      );
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = async (record) => {
    const name =
      displayValue(
        record[
          searchFields[0]
        ]
      ) || "this record";

    if (
      !window.confirm(
        `Delete ${name}? This will soft-delete the record.`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.request(
        `${endpoint}/${record._id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        `${title.slice(
          0,
          -1
        )} deleted successfully.`
      );

      await loadData();
    } catch (requestError) {
      setError(
        getError(
          requestError,
          `Unable to delete ${title.toLowerCase()}.`
        )
      );
    }
  };

  const changeStatus = async (
    record,
    status
  ) => {
    if (record[statusField] === status) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await api.request(
        `${endpoint}/${record._id}/status`,
        {
          method: "PATCH",
          body: { status },
        }
      );

      setSuccess(
        `Status changed to ${status}.`
      );

      await loadData();
    } catch (requestError) {
      setError(
        getError(
          requestError,
          "Unable to change status."
        )
      );
    }
  };

  const renderField = (field) => {
    const dependency =
      dependencyData[field.dependency] ||
      [];

    if (field.type === "select") {
      return (
        <select
          name={field.name}
          value={form[field.name] ?? ""}
          onChange={handleChange}
          required={!field.optional}
        >
          <option value="">
            {field.placeholder ||
              `Select ${field.label}`}
          </option>

          {field.options?.map(
            (option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            )
          )}

          {dependency.map(
            (item) => (
              <option
                key={item._id}
                value={item._id}
              >
                {field.getOptionLabel
                  ? field.getOptionLabel(
                      item
                    )
                  : displayValue(
                      item[
                        field.optionValue ||
                          "name"
                      ]
                    )}
              </option>
            )
          )}
        </select>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label className="checkbox-field">
          <input
            type="checkbox"
            name={field.name}
            checked={Boolean(
              form[field.name]
            )}
            onChange={handleChange}
          />

          <span>
            {field.label}
          </span>
        </label>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          name={field.name}
          value={form[field.name] ?? ""}
          onChange={handleChange}
          placeholder={field.placeholder}
          rows={4}
          required={!field.optional}
        />
      );
    }

    return (
      <input
        type={field.type || "text"}
        name={field.name}
        value={form[field.name] ?? ""}
        onChange={handleChange}
        placeholder={field.placeholder}
        required={!field.optional}
      />
    );
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            ADMINISTRATION
          </div>

          <h1>{title}</h1>

          <p className="muted">
            {description}
          </p>
        </div>

        <div className="hero-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            className="primary-button"
            type="button"
            onClick={openCreate}
          >
            <Plus size={17} />
            Add {title.slice(0, -1)}
          </button>
        </div>
      </div>

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

      <div className="stats-grid">
        <StatCard
          label={`Total ${title}`}
          value={records.length}
          description="Records in the system"
        />

        <StatCard
          label="Active"
          value={activeCount}
          description="Currently active"
        />

        <StatCard
          label="Other Status"
          value={inactiveCount}
          description="Requires attention"
        />
      </div>

      <div className="content-card">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={`Search ${title.toLowerCase()}...`}
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
          >
            <option value="ALL">
              All Statuses
            </option>

            {STATUS_OPTIONS.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {formatLabel(status)}
                </option>
              )
            )}
          </select>
        </div>

        {loading ? (
          <div className="empty-state">
            <RefreshCw
              size={25}
              className="spin"
            />

            <p>Loading...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <Search size={30} />

            <h3>
              No {title.toLowerCase()} found
            </h3>

            <p className="muted">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(
                    (column) => (
                      <th key={column.key}>
                        {column.label}
                      </th>
                    )
                  )}

                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.map(
                  (record) => (
                    <tr key={record._id}>
                      {columns.map(
                        (column) => (
                          <td
                            key={
                              column.key
                            }
                          >
                            {column.status ? (
                              <span
                                className={`status-badge ${getStatusClass(
                                  record[
                                    column.key
                                  ]
                                )}`}
                              >
                                {formatLabel(
                                  record[
                                    column.key
                                  ]
                                )}
                              </span>
                            ) : column.date ? (
                              formatDate(
                                record[
                                  column.key
                                ]
                              )
                            ) : (
                              displayValue(
                                record[
                                  column.key
                                ]
                              )
                            )}
                          </td>
                        )
                      )}

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="icon-button"
                            title="View"
                            onClick={() => {
                              setSelectedRecord(
                                record
                              );
                              setDetailsOpen(
                                true
                              );
                            }}
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            className="icon-button"
                            title="Edit"
                            onClick={() =>
                              openEdit(record)
                            }
                          >
                            <Pencil size={16} />
                          </button>

                          {statusEnabled && (
                            <button
                              type="button"
                              className="icon-button"
                              title="Set Active"
                              onClick={() =>
                                changeStatus(
                                  record,
                                  "ACTIVE"
                                )
                              }
                            >
                              <CheckCircle2
                                size={16}
                              />
                            </button>
                          )}

                          {deleteEnabled && (
                            <button
                              type="button"
                              className="icon-button danger"
                              title="Delete"
                              onClick={() =>
                                removeRecord(
                                  record
                                )
                              }
                            >
                              <Trash2
                                size={16}
                              />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span className="muted">
            Showing {filteredRecords.length} of{" "}
            {records.length}
          </span>
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingRecord
                    ? `Edit ${title.slice(0, -1)}`
                    : `Add ${title.slice(0, -1)}`}
                </h2>

                <p className="muted">
                  Enter the required information.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={closeModal}
                disabled={saving}
              >
                <X size={18} />
              </button>
            </div>

            <form
              className="client-form"
              onSubmit={submit}
            >
              <div className="form-grid">
                {fields.map(
                  (field) => (
                    <label
                      key={field.name}
                      className={
                        field.fullWidth
                          ? "full-width"
                          : ""
                      }
                    >
                      {field.type !==
                        "checkbox" && (
                        <>
                          {field.label}
                          {!field.optional &&
                            " *"}
                        </>
                      )}

                      {renderField(field)}
                    </label>
                  )
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                    ? "Update"
                    : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsOpen && selectedRecord && (
        <div className="modal-backdrop">
          <div className="modal large-modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">
                  DETAILS
                </div>

                <h2>
                  {displayValue(
                    selectedRecord[
                      searchFields[0]
                    ]
                  )}
                </h2>
              </div>

              <button
                type="button"
                className="icon-button"
                onClick={() =>
                  setDetailsOpen(false)
                }
              >
                <X size={18} />
              </button>
            </div>

            <div className="details-grid">
              {fields.map(
                (field) => (
                  <div
                    className="detail-item"
                    key={field.name}
                  >
                    <span className="muted">
                      {field.label}
                    </span>

                    <strong>
                      {field.name ===
                      statusField ? (
                        <span
                          className={`status-badge ${getStatusClass(
                            selectedRecord[
                              field.name
                            ]
                          )}`}
                        >
                          {formatLabel(
                            selectedRecord[
                              field.name
                            ]
                          )}
                        </span>
                      ) : field.type ===
                        "date" ? (
                        formatDate(
                          selectedRecord[
                            field.name
                          ]
                        )
                      ) : (
                        displayValue(
                          selectedRecord[
                            field.name
                          ]
                        )
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setDetailsOpen(false)
                }
              >
                Close
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setDetailsOpen(false);
                  openEdit(
                    selectedRecord
                  );
                }}
              >
                <Pencil size={16} />
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}