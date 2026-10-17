
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

import { getVehicles, createVehicle } from "../../api/vehicle.api";
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

const EMPTY_FORM = {
  vehicleNumber: "",
  vehicleType: "SEDAN",
  seatingCapacity: "",
  vendor: "",
  currentDriver: "",
  event: "",
  brand: "",
  model: "",
  manufactureYear: "",
  fuelType: "DIESEL",
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
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
}

function getVendorName(vehicle) {
  if (typeof vehicle?.vendor === "object") {
    return vehicle.vendor.companyName || "-";
  }

  return vehicle?.vendor || "-";
}

function getDriverName(vehicle) {
  if (!vehicle?.currentDriver) return "Unassigned";

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

  return String(vehicle.currentDriver);
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong."
  );
}

function VehicleManagement() {
  const { user } = useAuth();

  const canCreate = [
    "ADMIN",
    "OPERATIONS_MANAGER",
  ].includes(user?.role);

  const [vehicles, setVehicles] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const availableEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          !["COMPLETED", "CANCELLED"].includes(
            event.status
          )
      ),
    [events]
  );

  const availableDrivers = useMemo(
    () =>
      drivers.filter(
        (driver) =>
          driver.status === "ACTIVE" &&
          !driver.currentVehicle &&
          getId(driver.vendor) === form.vendor
      ),
    [drivers, form.vendor]
  );

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return vehicles;

    return vehicles.filter((vehicle) =>
      [
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        getVendorName(vehicle),
        getDriverName(vehicle),
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [vehicles, search]);

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        vehicleResponse,
        vendorResponse,
        driverResponse,
        eventResponse,
      ] = await Promise.all([
        getVehicles(),
        getVendors(),
        getDrivers(),
        getEvents(),
      ]);

      const vehicleData = unwrapResponse(vehicleResponse);
      const vendorData = unwrapResponse(vendorResponse);
      const driverData = unwrapResponse(driverResponse);
      const eventData = unwrapResponse(eventResponse);

      setVehicles(
        Array.isArray(vehicleData) ? vehicleData : []
      );

      setVendors(
        Array.isArray(vendorData) ? vendorData : []
      );

      setDrivers(
        Array.isArray(driverData) ? driverData : []
      );

      setEvents(
        Array.isArray(eventData) ? eventData : []
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "vendor" ? { currentDriver: "" } : {}),
    }));
  };

  const openForm = () => {
    setForm(EMPTY_FORM);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.vehicleNumber.trim()) {
      setError("Vehicle number is required.");
      return;
    }

    if (!form.vendor) {
      setError("Please select a vendor.");
      return;
    }

    if (!form.event) {
      setError("Please select an event.");
      return;
    }

    if (
      !form.seatingCapacity ||
      Number(form.seatingCapacity) < 1
    ) {
      setError("Enter a valid seating capacity.");
      return;
    }

    if (
      form.currentDriver &&
      !availableDrivers.some(
        (driver) => getId(driver._id) === form.currentDriver
      )
    ) {
      setError(
        "Select an active, unassigned driver belonging to this vendor."
      );
      return;
    }

    setSaving(true);

    const payload = {
      vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
      vehicleType: form.vehicleType,
      seatingCapacity: Number(form.seatingCapacity),
      vendor: form.vendor,
      event: form.event,
    };

    if (form.currentDriver) {
      payload.currentDriver = form.currentDriver;
    }

    if (form.brand.trim()) {
      payload.brand = form.brand.trim();
    }

    if (form.model.trim()) {
      payload.model = form.model.trim();
    }

    if (form.manufactureYear) {
      payload.manufactureYear = Number(form.manufactureYear);
    }

    if (form.fuelType) {
      payload.fuelType = form.fuelType;
    }

    try {
      await createVehicle(payload);

      setShowForm(false);
      setForm(EMPTY_FORM);
      setSuccess("Vehicle registered successfully.");

      await loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vehicle-page">
      <div className="vehicle-page__header">
        <div>
          <h1>Vehicles</h1>
          <p>
            Register vehicles and manage your event fleet.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <strong>Total: {vehicles.length}</strong>

          {canCreate && (
            <button
              type="button"
              className="vehicle-btn vehicle-btn--primary"
              onClick={openForm}
            >
              + Register Vehicle
            </button>
          )}
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
        {loading ? (
          <div className="vehicle-loading">
            Loading vehicles...
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="vehicle-empty">
            <h3>No vehicles found</h3>
            <p>
              {canCreate
                ? "Select Register Vehicle to add your first vehicle."
                : "Vehicles will appear here once registered."}
            </p>
          </div>
        ) : (
          <div className="vehicle-table-wrapper">
            <table className="vehicle-table">
              <thead>
                <tr>
                  <th>Vehicle Number</th>
                  <th>Type</th>
                  <th>Vendor</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>Events</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.map((vehicle) => (
                  <tr key={vehicle._id}>
                    <td>
                      <strong>{vehicle.vehicleNumber}</strong>
                    </td>
                    <td>{vehicle.vehicleType}</td>
                    <td>{getVendorName(vehicle)}</td>
                    <td>{getDriverName(vehicle)}</td>
                    <td>{vehicle.status || "-"}</td>
                    <td>{vehicle.eventsUsedFor?.length || 0}</td>
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
                <h2>Register Vehicle</h2>
                <p>
                  Enter vehicle details and select the event
                  it will be registered for.
                </p>
              </div>

              <button
                type="button"
                className="vehicle-modal__close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>
            </div>

            <form className="vehicle-form" onSubmit={handleSubmit}>
              <div className="vehicle-form-grid">
                <label>
                  Vehicle Number *
                  <input
                    name="vehicleNumber"
                    value={form.vehicleNumber}
                    onChange={handleChange}
                    placeholder="MH12AB1234"
                    required
                  />
                </label>

                <label>
                  Vehicle Type *
                  <select
                    name="vehicleType"
                    value={form.vehicleType}
                    onChange={handleChange}
                    required
                  >
                    {VEHICLE_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Seating Capacity *
                  <input
                    type="number"
                    name="seatingCapacity"
                    min="1"
                    value={form.seatingCapacity}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label>
                  Vendor *
                  <select
                    name="vendor"
                    value={form.vendor}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Vendor</option>
                    {vendors.map((vendor) => (
                      <option key={vendor._id} value={vendor._id}>
                        {vendor.companyName}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Event *
                  <select
                    name="event"
                    value={form.event}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Event</option>
                    {availableEvents.map((event) => (
                      <option key={event._id} value={event._id}>
                        {event.name} ({event.eventCode})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Driver
                  <select
                    name="currentDriver"
                    value={form.currentDriver}
                    onChange={handleChange}
                    disabled={!form.vendor}
                  >
                    <option value="">No driver</option>
                    {availableDrivers.map((driver) => (
                      <option key={driver._id} value={driver._id}>
                        {[driver.firstName, driver.lastName]
                          .filter(Boolean)
                          .join(" ") || driver.phone || "Unnamed Driver"}
                      </option>
                    ))}
                  </select>
                  {form.vendor && availableDrivers.length === 0 && (
                    <small>
                      No active, unassigned drivers are available
                      for this vendor.
                    </small>
                  )}
                </label>

                <label>
                  Brand
                  <input
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Model
                  <input
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Manufacture Year
                  <input
                    type="number"
                    name="manufactureYear"
                    min="1980"
                    max={new Date().getFullYear() + 1}
                    value={form.manufactureYear}
                    onChange={handleChange}
                  />
                </label>

                <label>
                  Fuel Type
                  <select
                    name="fuelType"
                    value={form.fuelType}
                    onChange={handleChange}
                  >
                    {FUEL_TYPES.map((fuel) => (
                      <option key={fuel} value={fuel}>
                        {fuel}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {availableEvents.length === 0 && (
                <p>
                  No eligible events are available. Create an event
                  before registering a vehicle.
                </p>
              )}

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
                  disabled={
                    saving ||
                    availableEvents.length === 0 ||
                    vendors.length === 0
                  }
                >
                  {saving ? "Registering..." : "Register Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleManagement;
