import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../../auth/AuthContext";

import {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
} from "../../api/vehicle.api";

import { getDrivers } from "../../api/driver.api";
import { getVendors } from "../../api/vendor.api";

import "../../styles/vehicle-management.css";

const VEHICLE_TYPES = [
  "HATCHBACK",
  "SEDAN",
  "SUV",
  "MUV",
  "TEMPO_TRAVELLER",
  "MINI_BUS",
  "BUS",
];

const FUEL_TYPES = [
  "PETROL",
  "DIESEL",
  "CNG",
  "ELECTRIC",
  "HYBRID",
];

const VEHICLE_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "ON_DUTY",
  "MAINTENANCE",
  "INACTIVE",
];

const emptyForm = {
  vehicleNumber: "",
  vehicleType: "SEDAN",
  brand: "",
  model: "",
  manufactureYear: "",
  fuelType: "DIESEL",
  seatingCapacity: "",
  vendor: "",
  currentDriver: "",
  rcExpiry: "",
  insuranceExpiry: "",
  permitExpiry: "",
  fitnessExpiry: "",
  pucExpiry: "",
  gpsEnabled: false,
};

const unwrapResponse = (response) => {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
};

const getId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "object") {
    return value._id || value.id || "";
  }

  return value;
};

const getVendorName = (vehicle) => {
  if (!vehicle?.vendor) {
    return "-";
  }

  if (typeof vehicle.vendor === "object") {
    return (
      vehicle.vendor.companyName ||
      vehicle.vendor.name ||
      "-"
    );
  }

  return vehicle.vendor;
};

const getDriverName = (vehicle) => {
  if (!vehicle?.currentDriver) {
    return "Unassigned";
  }

  if (typeof vehicle.currentDriver === "object") {
    return [
      vehicle.currentDriver.firstName,
      vehicle.currentDriver.lastName,
    ]
      .filter(Boolean)
      .join(" ") || "Assigned";
  }

  return vehicle.currentDriver;
};

const formatDate = (date) => {
  if (!date) {
    return "-";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toDateInput = (date) => {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().split("T")[0];
};

function VehicleManagement() {
  const { user } = useAuth();

  const [vehicles, setVehicles] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [showForm, setShowForm] = useState(false);
  const [showView, setShowView] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState(null);
  const [viewingVehicle, setViewingVehicle] = useState(null);

  const [form, setForm] = useState(emptyForm);

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "SUPER_ADMIN";

  const canManage =
    isAdmin ||
    user?.role === "OPERATIONS_MANAGER";

  const canDelete = isAdmin;

  const extractList = (response) => {
    const data = unwrapResponse(response);

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.vehicles)) {
      return data.vehicles;
    }

    if (Array.isArray(data?.vendors)) {
      return data.vendors;
    }

    if (Array.isArray(data?.drivers)) {
      return data.drivers;
    }

    return [];
  };

  const getErrorMessage = (err) => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Something went wrong."
    );
  };

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        vehiclesResponse,
        vendorsResponse,
        driversResponse,
      ] = await Promise.all([
        getVehicles(),
        getVendors(),
        getDrivers(),
      ]);

      setVehicles(extractList(vehiclesResponse));
      setVendors(extractList(vendorsResponse));
      setDrivers(extractList(driversResponse));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const matchesSearch =
        !query ||
        vehicle.vehicleNumber
          ?.toLowerCase()
          .includes(query) ||
        vehicle.brand
          ?.toLowerCase()
          .includes(query) ||
        vehicle.model
          ?.toLowerCase()
          .includes(query) ||
        getVendorName(vehicle)
          .toLowerCase()
          .includes(query) ||
        getDriverName(vehicle)
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        vehicle.status === statusFilter;

      const matchesType =
        typeFilter === "ALL" ||
        vehicle.vehicleType === typeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType
      );
    });
  }, [
    vehicles,
    search,
    statusFilter,
    typeFilter,
  ]);

  const counts = useMemo(() => {
    return {
      total: vehicles.length,
      available: vehicles.filter(
        (vehicle) =>
          vehicle.status === "AVAILABLE"
      ).length,
      assigned: vehicles.filter(
        (vehicle) =>
          vehicle.status === "ASSIGNED"
      ).length,
      onDuty: vehicles.filter(
        (vehicle) =>
          vehicle.status === "ON_DUTY"
      ).length,
      maintenance: vehicles.filter(
        (vehicle) =>
          vehicle.status === "MAINTENANCE"
      ).length,
    };
  }, [vehicles]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingVehicle(null);
  };

  const openCreate = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEdit = (vehicle) => {
    setEditingVehicle(vehicle);

    setForm({
      vehicleNumber:
        vehicle.vehicleNumber || "",
      vehicleType:
        vehicle.vehicleType || "SEDAN",
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      manufactureYear:
        vehicle.manufactureYear || "",
      fuelType:
        vehicle.fuelType || "DIESEL",
      seatingCapacity:
        vehicle.seatingCapacity || "",
      vendor: getId(vehicle.vendor),
      currentDriver:
        getId(vehicle.currentDriver),
      rcExpiry: toDateInput(vehicle.rcExpiry),
      insuranceExpiry: toDateInput(
        vehicle.insuranceExpiry
      ),
      permitExpiry: toDateInput(
        vehicle.permitExpiry
      ),
      fitnessExpiry: toDateInput(
        vehicle.fitnessExpiry
      ),
      pucExpiry: toDateInput(
        vehicle.pucExpiry
      ),
      gpsEnabled:
        Boolean(vehicle.gpsEnabled),
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
    resetForm();
  };

  const openView = (vehicle) => {
    setViewingVehicle(vehicle);
    setShowView(true);
  };

  const closeView = () => {
    setViewingVehicle(null);
    setShowView(false);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } =
      event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.vehicleNumber.trim()) {
      setError("Vehicle number is required.");
      return;
    }

    if (!form.vehicleType) {
      setError("Vehicle type is required.");
      return;
    }

    if (!form.seatingCapacity) {
      setError(
        "Seating capacity is required."
      );
      return;
    }

    if (!form.vendor) {
      setError("Vendor is required.");
      return;
    }

    if (
      Number(form.seatingCapacity) < 1
    ) {
      setError(
        "Seating capacity must be at least 1."
      );
      return;
    }

    if (
      form.manufactureYear &&
      Number(form.manufactureYear) <
        1980
    ) {
      setError(
        "Manufacture year must be 1980 or later."
      );
      return;
    }

    const payload = {
      vehicleNumber:
        form.vehicleNumber.trim(),
      vehicleType: form.vehicleType,
      brand: form.brand.trim(),
      model: form.model.trim(),
      seatingCapacity:
        Number(form.seatingCapacity),
      vendor: form.vendor,
      gpsEnabled: Boolean(
        form.gpsEnabled
      ),
    };

    if (form.manufactureYear) {
      payload.manufactureYear =
        Number(form.manufactureYear);
    }

    if (form.fuelType) {
      payload.fuelType = form.fuelType;
    }

    if (form.currentDriver) {
      payload.currentDriver =
        form.currentDriver;
    } else if (editingVehicle) {
      payload.currentDriver = null;
    }

    if (form.rcExpiry) {
      payload.rcExpiry = form.rcExpiry;
    }

    if (form.insuranceExpiry) {
      payload.insuranceExpiry =
        form.insuranceExpiry;
    }

    if (form.permitExpiry) {
      payload.permitExpiry =
        form.permitExpiry;
    }

    if (form.fitnessExpiry) {
      payload.fitnessExpiry =
        form.fitnessExpiry;
    }

    if (form.pucExpiry) {
      payload.pucExpiry =
        form.pucExpiry;
    }

    setSaving(true);

    try {
      if (editingVehicle) {
        await updateVehicle(
          editingVehicle._id,
          payload
        );

        setSuccess(
          "Vehicle updated successfully."
        );
      } else {
        await createVehicle(payload);

        setSuccess(
          "Vehicle created successfully."
        );
      }

      setShowForm(false);
      resetForm();

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    vehicle,
    status
  ) => {
    if (
      !window.confirm(
        `Change ${vehicle.vehicleNumber} status to ${status}?`
      )
    ) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await updateVehicleStatus(
        vehicle._id,
        status
      );

      setSuccess(
        "Vehicle status updated successfully."
      );

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (vehicle) => {
    if (!canDelete) {
      return;
    }

    const confirmed = window.confirm(
      `Delete vehicle ${vehicle.vehicleNumber}?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteVehicle(
        vehicle._id
      );

      setSuccess(
        "Vehicle deleted successfully."
      );

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const renderStatus = (status) => {
    return (
      <span
        className={`vehicle-status vehicle-status--${status
          ?.toLowerCase()
          .replace("_", "-")}`}
      >
        {status || "-"}
      </span>
    );
  };

  return (
    <div className="vehicle-page">
      <div className="vehicle-page__header">
        <div>
          <h1>Vehicle Management</h1>
          <p>
            Manage fleet vehicles, drivers,
            vendors and compliance details.
          </p>
        </div>

        {canManage && (
          <button
            className="vehicle-btn vehicle-btn--primary"
            onClick={openCreate}
          >
            + Add Vehicle
          </button>
        )}
      </div>

      {error && (
        <div className="vehicle-alert vehicle-alert--error">
          {error}
        </div>
      )}

      {success && (
        <div className="vehicle-alert vehicle-alert--success">
          {success}
        </div>
      )}

      <div className="vehicle-stats">
        <div className="vehicle-stat-card">
          <span>Total Vehicles</span>
          <strong>{counts.total}</strong>
        </div>

        <div className="vehicle-stat-card">
          <span>Available</span>
          <strong>{counts.available}</strong>
        </div>

        <div className="vehicle-stat-card">
          <span>Assigned</span>
          <strong>{counts.assigned}</strong>
        </div>

        <div className="vehicle-stat-card">
          <span>On Duty</span>
          <strong>{counts.onDuty}</strong>
        </div>

        <div className="vehicle-stat-card">
          <span>Maintenance</span>
          <strong>{counts.maintenance}</strong>
        </div>
      </div>

      <div className="vehicle-toolbar">
        <input
          type="text"
          placeholder="Search vehicle, vendor or driver..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
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

          {VEHICLE_STATUSES.map(
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

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            All Vehicle Types
          </option>

          {VEHICLE_TYPES.map(
            (type) => (
              <option
                key={type}
                value={type}
              >
                {type.replaceAll(
                  "_",
                  " "
                )}
              </option>
            )
          )}
        </select>

        <button
          className="vehicle-btn vehicle-btn--secondary"
          onClick={loadData}
        >
          Refresh
        </button>
      </div>

      <div className="vehicle-table-card">
        {loading ? (
          <div className="vehicle-loading">
            Loading vehicles...
          </div>
        ) : filteredVehicles.length ===
          0 ? (
          <div className="vehicle-empty">
            <h3>No vehicles found</h3>
            <p>
              Try changing your search or
              filters.
            </p>
          </div>
        ) : (
          <div className="vehicle-table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Type</th>
                  <th>Vendor</th>
                  <th>Driver</th>
                  <th>Seats</th>
                  <th>GPS</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map(
                  (vehicle) => (
                    <tr key={vehicle._id}>
                      <td>
                        <div className="vehicle-name">
                          <strong>
                            {
                              vehicle.vehicleNumber
                            }
                          </strong>

                          <span>
                            {[
                              vehicle.brand,
                              vehicle.model,
                            ]
                              .filter(
                                Boolean
                              )
                              .join(" ") ||
                              "Vehicle"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {vehicle.vehicleType?.replaceAll(
                          "_",
                          " "
                        )}
                      </td>

                      <td>
                        {getVendorName(
                          vehicle
                        )}
                      </td>

                      <td>
                        {getDriverName(
                          vehicle
                        )}
                      </td>

                      <td>
                        {
                          vehicle.seatingCapacity
                        }
                      </td>

                      <td>
                        {vehicle.gpsEnabled
                          ? "Enabled"
                          : "Disabled"}
                      </td>

                      <td>
                        {renderStatus(
                          vehicle.status
                        )}
                      </td>

                      <td>
                        <div className="vehicle-actions">
                          <button
                            className="vehicle-action vehicle-action--view"
                            onClick={() =>
                              openView(
                                vehicle
                              )
                            }
                          >
                            View
                          </button>

                          {canManage && (
                            <button
                              className="vehicle-action vehicle-action--edit"
                              onClick={() =>
                                openEdit(
                                  vehicle
                                )
                              }
                            >
                              Edit
                            </button>
                          )}

                          {canManage && (
                            <select
                              className="vehicle-action-status"
                              value={
                                vehicle.status
                              }
                              onChange={(
                                event
                              ) =>
                                handleStatusChange(
                                  vehicle,
                                  event
                                    .target
                                    .value
                                )
                              }
                              disabled={
                                vehicle.status ===
                                "ON_DUTY"
                              }
                            >
                              {VEHICLE_STATUSES.map(
                                (
                                  status
                                ) => (
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
                              className="vehicle-action vehicle-action--delete"
                              onClick={() =>
                                handleDelete(
                                  vehicle
                                )
                              }
                            >
                              Delete
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
      </div>

      {showForm && (
        <div className="vehicle-modal-backdrop">
          <div className="vehicle-modal vehicle-modal--large">
            <div className="vehicle-modal__header">
              <div>
                <h2>
                  {editingVehicle
                    ? "Edit Vehicle"
                    : "Add Vehicle"}
                </h2>

                <p>
                  Enter the vehicle and
                  compliance information.
                </p>
              </div>

              <button
                className="vehicle-modal__close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              className="vehicle-form"
              onSubmit={handleSubmit}
            >
              <div className="vehicle-form-section">
                <h3>Vehicle Information</h3>

                <div className="vehicle-form-grid">
                  <label>
                    Vehicle Number *
                    <input
                      name="vehicleNumber"
                      value={
                        form.vehicleNumber
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="MH12AB1234"
                      required
                    />
                  </label>

                  <label>
                    Vehicle Type *
                    <select
                      name="vehicleType"
                      value={
                        form.vehicleType
                      }
                      onChange={
                        handleChange
                      }
                      required
                    >
                      {VEHICLE_TYPES.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type.replaceAll(
                              "_",
                              " "
                            )}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Brand
                    <input
                      name="brand"
                      value={form.brand}
                      onChange={
                        handleChange
                      }
                      placeholder="Toyota"
                    />
                  </label>

                  <label>
                    Model
                    <input
                      name="model"
                      value={form.model}
                      onChange={
                        handleChange
                      }
                      placeholder="Innova Crysta"
                    />
                  </label>

                  <label>
                    Manufacture Year
                    <input
                      type="number"
                      name="manufactureYear"
                      value={
                        form.manufactureYear
                      }
                      onChange={
                        handleChange
                      }
                      min="1980"
                      max={
                        new Date().getFullYear() +
                        1
                      }
                    />
                  </label>

                  <label>
                    Fuel Type
                    <select
                      name="fuelType"
                      value={
                        form.fuelType
                      }
                      onChange={
                        handleChange
                      }
                    >
                      {FUEL_TYPES.map(
                        (type) => (
                          <option
                            key={type}
                            value={type}
                          >
                            {type}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Seating Capacity *
                    <input
                      type="number"
                      name="seatingCapacity"
                      value={
                        form.seatingCapacity
                      }
                      onChange={
                        handleChange
                      }
                      min="1"
                      required
                    />
                  </label>

                  <label>
                    Vendor *
                    <select
                      name="vendor"
                      value={form.vendor}
                      onChange={
                        handleChange
                      }
                      required
                    >
                      <option value="">
                        Select Vendor
                      </option>

                      {vendors.map(
                        (vendor) => (
                          <option
                            key={
                              vendor._id
                            }
                            value={
                              vendor._id
                            }
                          >
                            {
                              vendor.companyName
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Current Driver
                    <select
                      name="currentDriver"
                      value={
                        form.currentDriver
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        No Driver
                      </option>

                      {drivers
                        .filter(
                          (driver) =>
                            driver.status ===
                              "ACTIVE" ||
                            getId(
                              vehicleDriver(
                                editingVehicle
                              )
                            ) ===
                              driver._id
                        )
                        .map(
                          (driver) => (
                            <option
                              key={
                                driver._id
                              }
                              value={
                                driver._id
                              }
                            >
                              {[
                                driver.firstName,
                                driver.lastName,
                              ]
                                .filter(
                                  Boolean
                                )
                                .join(
                                  " "
                                )}
                            </option>
                          )
                        )}
                    </select>
                  </label>

                  <label className="vehicle-checkbox">
                    <input
                      type="checkbox"
                      name="gpsEnabled"
                      checked={
                        form.gpsEnabled
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      GPS Enabled
                    </span>
                  </label>
                </div>
              </div>

              <div className="vehicle-form-section">
                <h3>
                  Compliance & Documents
                </h3>

                <div className="vehicle-form-grid">
                  <label>
                    RC Expiry
                    <input
                      type="date"
                      name="rcExpiry"
                      value={
                        form.rcExpiry
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </label>

                  <label>
                    Insurance Expiry
                    <input
                      type="date"
                      name="insuranceExpiry"
                      value={
                        form.insuranceExpiry
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </label>

                  <label>
                    Permit Expiry
                    <input
                      type="date"
                      name="permitExpiry"
                      value={
                        form.permitExpiry
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </label>

                  <label>
                    Fitness Expiry
                    <input
                      type="date"
                      name="fitnessExpiry"
                      value={
                        form.fitnessExpiry
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </label>

                  <label>
                    PUC Expiry
                    <input
                      type="date"
                      name="pucExpiry"
                      value={
                        form.pucExpiry
                      }
                      onChange={
                        handleChange
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="vehicle-form-actions">
                <button
                  type="button"
                  className="vehicle-btn vehicle-btn--secondary"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="vehicle-btn vehicle-btn--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingVehicle
                    ? "Update Vehicle"
                    : "Create Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showView &&
        viewingVehicle && (
          <div className="vehicle-modal-backdrop">
            <div className="vehicle-modal">
              <div className="vehicle-modal__header">
                <div>
                  <h2>
                    Vehicle Details
                  </h2>

                  <p>
                    {
                      viewingVehicle.vehicleNumber
                    }
                  </p>
                </div>

                <button
                  className="vehicle-modal__close"
                  onClick={closeView}
                >
                  ×
                </button>
              </div>

              <div className="vehicle-details">
                <div className="vehicle-detail">
                  <span>Vehicle Number</span>
                  <strong>
                    {
                      viewingVehicle.vehicleNumber
                    }
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Type</span>
                  <strong>
                    {viewingVehicle.vehicleType?.replaceAll(
                      "_",
                      " "
                    )}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Brand</span>
                  <strong>
                    {viewingVehicle.brand ||
                      "-"}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Model</span>
                  <strong>
                    {viewingVehicle.model ||
                      "-"}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Manufacture Year</span>
                  <strong>
                    {
                      viewingVehicle.manufactureYear ||
                      "-"
                    }
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Fuel Type</span>
                  <strong>
                    {
                      viewingVehicle.fuelType ||
                      "-"
                    }
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Seating Capacity</span>
                  <strong>
                    {
                      viewingVehicle.seatingCapacity
                    }
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Vendor</span>
                  <strong>
                    {getVendorName(
                      viewingVehicle
                    )}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Current Driver</span>
                  <strong>
                    {getDriverName(
                      viewingVehicle
                    )}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>GPS</span>
                  <strong>
                    {viewingVehicle.gpsEnabled
                      ? "Enabled"
                      : "Disabled"}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Status</span>
                  <strong>
                    {renderStatus(
                      viewingVehicle.status
                    )}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>RC Expiry</span>
                  <strong>
                    {formatDate(
                      viewingVehicle.rcExpiry
                    )}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Insurance Expiry</span>
                  <strong>
                    {formatDate(
                      viewingVehicle.insuranceExpiry
                    )}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Permit Expiry</span>
                  <strong>
                    {formatDate(
                      viewingVehicle.permitExpiry
                    )}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>Fitness Expiry</span>
                  <strong>
                    {formatDate(
                      viewingVehicle.fitnessExpiry
                    )}
                  </strong>
                </div>

                <div className="vehicle-detail">
                  <span>PUC Expiry</span>
                  <strong>
                    {formatDate(
                      viewingVehicle.pucExpiry
                    )}
                  </strong>
                </div>
              </div>

              <div className="vehicle-form-actions">
                <button
                  className="vehicle-btn vehicle-btn--secondary"
                  onClick={closeView}
                >
                  Close
                </button>

                {canManage && (
                  <button
                    className="vehicle-btn vehicle-btn--primary"
                    onClick={() => {
                      closeView();
                      openEdit(
                        viewingVehicle
                      );
                    }}
                  >
                    Edit Vehicle
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function vehicleDriver(vehicle) {
  return vehicle?.currentDriver || null;
}

export default VehicleManagement;