
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useParams, useNavigate } from "react-router-dom";

import {
  getVehiclesByEvent,
  createVehicle,
  importEventVehicles,
} from "../../api/vehicle.api";

import { getVendors } from "../../api/vendor.api";
import { getDrivers } from "../../api/driver.api";
import { getEvents } from "../../api/event.api";

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
};

function unwrapResponse(response) {
  if (response?.data?.data !== undefined) {
    return response.data.data;
  }

  if (response?.data !== undefined) {
    return response.data;
  }

  return response;
}

function getId(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  if (typeof value === "object") {
    return String(value._id ?? value.id ?? "");
  }

  return String(value);
}

function getVendorName(vehicle) {
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
}

function getDriverName(vehicle) {
  if (!vehicle?.currentDriver) {
    return "Unassigned";
  }

  if (typeof vehicle.currentDriver === "object") {
    return (
      [
        vehicle.currentDriver.firstName,
        vehicle.currentDriver.lastName,
      ]
        .filter(Boolean)
        .join(" ") || "Assigned"
    );
  }

  return vehicle.currentDriver;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong."
  );
}

function EventVehicleManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importResult, setImportResult] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        getEvents(),
        getVehiclesByEvent(eventId),
        getVendors(),
        getDrivers(),
      ]);

      const [
        eventResult,
        vehicleResult,
        vendorResult,
        driverResult,
      ] = results;

      const errors = [];

      if (eventResult.status === "fulfilled") {
        const eventData = unwrapResponse(eventResult.value);
        const events = Array.isArray(eventData) ? eventData : [];

        const selectedEvent = events.find(
          (item) => getId(item._id) === getId(eventId)
        );

        setEvent(selectedEvent || null);

        if (!selectedEvent) {
          errors.push("The selected event could not be found.");
        }
      } else {
        setEvent(null);
        errors.push(
          `Events could not be loaded: ${getErrorMessage(
            eventResult.reason
          )}`
        );
      }

      if (vehicleResult.status === "fulfilled") {
        const vehicleData = unwrapResponse(vehicleResult.value);

        setVehicles(
          Array.isArray(vehicleData) ? vehicleData : []
        );
      } else {
        setVehicles([]);
        errors.push(
          `Vehicles could not be loaded: ${getErrorMessage(
            vehicleResult.reason
          )}`
        );
      }

      if (vendorResult.status === "fulfilled") {
        const vendorData = unwrapResponse(vendorResult.value);

        setVendors(
          Array.isArray(vendorData) ? vendorData : []
        );
      } else {
        setVendors([]);
        errors.push(
          `Vendors could not be loaded: ${getErrorMessage(
            vendorResult.reason
          )}`
        );
      }

      if (driverResult.status === "fulfilled") {
        const driverData = unwrapResponse(driverResult.value);

        setDrivers(
          Array.isArray(driverData) ? driverData : []
        );
      } else {
        setDrivers([]);
        errors.push(
          `Drivers could not be loaded: ${getErrorMessage(
            driverResult.reason
          )}`
        );
      }

      if (errors.length > 0) {
        setError(errors.join(" "));
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadData();
    } else {
      setLoading(false);
      setError("Event ID is missing.");
    }
  }, [eventId]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return vehicles;
    }

    return vehicles.filter(
      (vehicle) =>
        vehicle.vehicleNumber
          ?.toLowerCase()
          .includes(query) ||
        vehicle.vehicleType
          ?.toLowerCase()
          .includes(query) ||
        getVendorName(vehicle)
          .toLowerCase()
          .includes(query) ||
        getDriverName(vehicle)
          .toLowerCase()
          .includes(query)
    );
  }, [vehicles, search]);

  // Only show active, unassigned drivers for the selected vendor.
  const filteredDrivers = useMemo(() => {
    if (!form.vendor) {
      return [];
    }

    return drivers.filter((driver) => {
      const belongsToVendor =
        getId(driver.vendor) === getId(form.vendor);

      const isActive =
        String(driver.status || "").toUpperCase() === "ACTIVE";

      const isUnassigned =
        !driver.currentVehicle ||
        getId(driver.currentVehicle) === "";

      return belongsToVendor && isActive && isUnassigned;
    });
  }, [drivers, form.vendor]);

  const resetForm = () => {
    setForm({ ...emptyForm });
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "vendor" ? { currentDriver: "" } : {}),
    }));
  };

  const handleCreateVehicle = async (event) => {
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

    if (
      !form.seatingCapacity ||
      !Number.isFinite(Number(form.seatingCapacity)) ||
      Number(form.seatingCapacity) <= 0
    ) {
      setError("Enter a valid seating capacity.");
      return;
    }

    if (!form.vendor) {
      setError("Vendor is required.");
      return;
    }

    if (
      form.currentDriver &&
      !filteredDrivers.some(
        (driver) =>
          getId(driver._id) === getId(form.currentDriver)
      )
    ) {
      setError(
        "The selected driver is no longer available for this vendor. Please select another driver."
      );
      return;
    }

    setSaving(true);

    try {
      const payload = {
        vehicleNumber: form.vehicleNumber
          .trim()
          .replace(/\s+/g, "")
          .toUpperCase(),
        vehicleType: form.vehicleType,
        seatingCapacity: Number(form.seatingCapacity),
        vendor: form.vendor,
        event: eventId,
      };

      if (form.brand.trim()) {
        payload.brand = form.brand.trim();
      }

      if (form.model.trim()) {
        payload.model = form.model.trim();
      }

      if (form.manufactureYear) {
        payload.manufactureYear = Number(
          form.manufactureYear
        );
      }

      if (form.fuelType) {
        payload.fuelType = form.fuelType;
      }

      if (form.currentDriver) {
        payload.currentDriver = form.currentDriver;
      }

      await createVehicle(payload);

      setSuccess(
        "Vehicle added to this event successfully."
      );

      setShowForm(false);
      resetForm();

      await loadData();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const handleExcelImport = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setImportResult(null);

    if (!selectedFile) {
      setError("Please select an Excel file.");
      return;
    }

    const fileName = selectedFile.name.toLowerCase();

    if (
      !fileName.endsWith(".xlsx") &&
      !fileName.endsWith(".xls")
    ) {
      setError("Only .xlsx and .xls files are allowed.");
      return;
    }

    setImporting(true);

    try {
      const response = await importEventVehicles(
        eventId,
        selectedFile
      );

      const result = unwrapResponse(response);

      const details = {
        imported: Array.isArray(result?.imported)
          ? result.imported
          : [],
        skipped: Array.isArray(result?.skipped)
          ? result.skipped
          : [],
        failed: Array.isArray(result?.failed)
          ? result.failed
          : [],
      };

      setImportResult(details);

      setSuccess(
        `Import completed. Imported: ${
          result?.importedCount ?? details.imported.length
        }, skipped: ${
          result?.skippedCount ?? details.skipped.length
        }, failed: ${
          result?.failedCount ?? details.failed.length
        }.`
      );

      setSelectedFile(null);
      setShowImport(false);

      await loadData();
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files?.[0] || null);
  };

  if (loading) {
    return (
      <div className="vehicle-page">
        <div className="vehicle-loading">
          Loading event vehicles...
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="vehicle-page">
        <div className="vehicle-alert vehicle-alert--error">
          {error || "Event not found."}
        </div>

        <button
          type="button"
          className="vehicle-btn vehicle-btn--secondary"
          onClick={() => navigate("/admin/events")}
        >
          Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="vehicle-page">
      <div className="vehicle-page__header">
        <div>
          <button
            type="button"
            className="vehicle-btn vehicle-btn--secondary"
            onClick={() => navigate("/admin/events")}
            style={{ marginBottom: "12px" }}
          >
            ← Back to Events
          </button>

          <h1>Event Vehicles</h1>

          <p>
            {event.name}{" "}
            <strong>({event.eventCode})</strong>
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            className="vehicle-btn vehicle-btn--secondary"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowImport(true);
            }}
          >
            Import Excel
          </button>

          <button
            type="button"
            className="vehicle-btn vehicle-btn--primary"
            onClick={() => {
              resetForm();
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
          >
            + Add Vehicle
          </button>
        </div>
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

      {importResult && (
        <section
          className="vehicle-table-card"
          style={{
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "16px",
            }}
          >
            <h2 style={{ margin: 0 }}>
              Excel Import Details
            </h2>

            <button
              type="button"
              className="vehicle-btn vehicle-btn--secondary"
              onClick={() => setImportResult(null)}
            >
              Dismiss
            </button>
          </div>

          <p>
            Imported: {importResult.imported.length}{" "}
            | Skipped: {importResult.skipped.length}{" "}
            | Failed: {importResult.failed.length}
          </p>

          {importResult.failed.length > 0 && (
            <>
              <h3>Failed Rows</h3>

              <div className="vehicle-table-wrapper">
                <table className="vehicle-table">
                  <thead>
                    <tr>
                      <th>Excel Row</th>
                      <th>Vehicle Number</th>
                      <th>Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {importResult.failed.map((item, index) => (
                      <tr key={`${item.row}-${index}`}>
                        <td>{item.row ?? "—"}</td>
                        <td>{item.vehicleNumber || "—"}</td>
                        <td>{item.reason || "Unknown error"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {importResult.skipped.length > 0 && (
            <>
              <h3 style={{ marginTop: "20px" }}>
                Skipped Rows
              </h3>

              <div className="vehicle-table-wrapper">
                <table className="vehicle-table">
                  <thead>
                    <tr>
                      <th>Excel Row</th>
                      <th>Vehicle Number</th>
                      <th>Reason</th>
                    </tr>
                  </thead>

                  <tbody>
                    {importResult.skipped.map((item, index) => (
                      <tr key={`${item.row}-${index}`}>
                        <td>{item.row ?? "—"}</td>
                        <td>{item.vehicleNumber || "—"}</td>
                        <td>
                          {item.reason ||
                            "Already registered or skipped."}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {importResult.failed.length === 0 &&
            importResult.skipped.length === 0 && (
              <p>All rows were imported successfully.</p>
            )}
        </section>
      )}

      <div className="vehicle-stats">
        <div className="vehicle-stat-card">
          <span>Vehicles for this event</span>
          <strong>{vehicles.length}</strong>
        </div>

        <div className="vehicle-stat-card">
          <span>Available</span>
          <strong>
            {
              vehicles.filter(
                (vehicle) => vehicle.status === "AVAILABLE"
              ).length
            }
          </strong>
        </div>

        <div className="vehicle-stat-card">
          <span>Assigned</span>
          <strong>
            {
              vehicles.filter(
                (vehicle) => vehicle.status === "ASSIGNED"
              ).length
            }
          </strong>
        </div>

        <div className="vehicle-stat-card">
          <span>On Duty</span>
          <strong>
            {
              vehicles.filter(
                (vehicle) => vehicle.status === "ON_DUTY"
              ).length
            }
          </strong>
        </div>
      </div>

      <div className="vehicle-toolbar">
        <input
          type="search"
          placeholder="Search vehicle, vendor or driver..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <button
          type="button"
          className="vehicle-btn vehicle-btn--secondary"
          onClick={loadData}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      <div className="vehicle-table-card">
        {filteredVehicles.length === 0 ? (
          <div className="vehicle-empty">
            <h3>No vehicles added</h3>

            <p>
              Add vehicles manually or import the vendor
              vehicle Excel sheet for this event.
            </p>
          </div>
        ) : (
          <div className="vehicle-table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Type</th>
                  <th>Seating</th>
                  <th>Vendor</th>
                  <th>Driver</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td>
                      <strong>{vehicle.vehicleNumber}</strong>
                    </td>

                    <td>{vehicle.vehicleType}</td>

                    <td>{vehicle.seatingCapacity || "-"}</td>

                    <td>{getVendorName(vehicle)}</td>

                    <td>{getDriverName(vehicle)}</td>

                    <td>
                      <span
                        className={`vehicle-status vehicle-status--${String(
                          vehicle.status || ""
                        )
                          .toLowerCase()
                          .replace("_", "-")}`}
                      >
                        {vehicle.status || "-"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="vehicle-modal-backdrop">
          <div className="vehicle-modal">
            <div className="vehicle-modal__header">
              <div>
                <h2>Add Vehicle</h2>

                <p>
                  Add a vehicle specifically for this event.
                </p>
              </div>

              <button
                type="button"
                className="vehicle-modal__close"
                onClick={() => setShowForm(false)}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form
              className="vehicle-form"
              onSubmit={handleCreateVehicle}
            >
              <div className="vehicle-form-grid">
                <label>
                  Vehicle Number *
                  <input
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleFormChange}
                    placeholder="MH12AB1234"
                    required
                  />
                </label>

                <label>
                  Vehicle Type *
                  <select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleFormChange}
                    required
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Seating Capacity *
                  <input
                    type="number"
                    min="1"
                    name="seatingCapacity"
                    value={form.seatingCapacity}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Vendor *
                  <select
                    name="vendor"
                    value={form.vendor}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select Vendor</option>

                    {vendors.map((vendor) => (
                      <option
                        key={vendor._id}
                        value={vendor._id}
                      >
                        {vendor.companyName}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Driver
                  <select
                    name="currentDriver"
                    value={form.currentDriver}
                    onChange={handleFormChange}
                    disabled={!form.vendor}
                  >
                    <option value="">No driver</option>

                    {filteredDrivers.map((driver) => (
                      <option
                        key={driver._id}
                        value={driver._id}
                      >
                        {[
                          driver.firstName,
                          driver.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ") ||
                          driver.phone ||
                          "Unnamed Driver"}
                      </option>
                    ))}
                  </select>

                  {form.vendor && filteredDrivers.length === 0 && (
                    <small>
                      No active, unassigned drivers found for this vendor.
                    </small>
                  )}
                </label>

                <label>
                  Brand
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Model
                  <input
                    name="model"
                    value={form.model}
                    onChange={handleFormChange}
                  />
                </label>

                <label>
                  Manufacture Year
                  <input
                    type="number"
                    name="manufactureYear"
                    value={form.manufactureYear}
                    onChange={handleFormChange}
                    min="1980"
                    max="2100"
                  />
                </label>

                <label>
                  Fuel Type
                  <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleFormChange}
                  >
                    {FUEL_TYPES.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="vehicle-form-actions">
                <button
                  type="button"
                  className="vehicle-btn vehicle-btn--secondary"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="vehicle-btn vehicle-btn--primary"
                  disabled={saving}
                >
                  {saving ? "Adding..." : "Add Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImport && (
        <div className="vehicle-modal-backdrop">
          <div className="vehicle-modal">
            <div className="vehicle-modal__header">
              <div>
                <h2>Import Event Vehicles</h2>

                <p>
                  Upload the vehicle list received from
                  the vendor.
                </p>
              </div>

              <button
                type="button"
                className="vehicle-modal__close"
                onClick={() => setShowImport(false)}
                disabled={importing}
              >
                ×
              </button>
            </div>

            <form
              className="vehicle-form"
              onSubmit={handleExcelImport}
            >
              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "18px",
                }}
              >
                <strong>Excel columns</strong>

                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#6b7280",
                    fontSize: "13px",
                    lineHeight: "1.6",
                  }}
                >
                  Required: Vehicle Number, Vehicle Type,
                  Vendor, Seating Capacity.
                  <br />
                  Optional: Driver Phone, Brand, Model,
                  Manufacture Year, Fuel Type.
                </p>
              </div>

              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontWeight: 600,
                  fontSize: "13px",
                }}
              >
                Excel File

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  required
                />
              </label>

              {selectedFile && (
                <p
                  style={{
                    marginTop: "12px",
                    fontSize: "13px",
                    color: "#374151",
                  }}
                >
                  Selected:{" "}
                  <strong>{selectedFile.name}</strong>
                </p>
              )}

              <div className="vehicle-form-actions">
                <button
                  type="button"
                  className="vehicle-btn vehicle-btn--secondary"
                  onClick={() => {
                    setShowImport(false);
                    setSelectedFile(null);
                  }}
                  disabled={importing}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="vehicle-btn vehicle-btn--primary"
                  disabled={importing || !selectedFile}
                >
                  {importing
                    ? "Importing..."
                    : "Import Vehicles"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default EventVehicleManagement;
