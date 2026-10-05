import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext";

import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  updateLocationStatus,
} from "../../api/location.api";

import { ROLES } from "../../utils/roles";

import "../../styles/location-management.css";

const STATUS_OPTIONS = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "BLOCKED",
];

const EMPTY_FORM = {
  locationCode: "",
  name: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pincode: "",
  latitude: "",
  longitude: "",
  landmark: "",
};

function LocationManagement() {
  const { user } = useAuth();

  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [modal, setModal] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const canManage =
    user?.role === ROLES.ADMIN ||
    user?.role === ROLES.OPERATIONS_MANAGER;

  const canDelete = user?.role === ROLES.ADMIN;

  const loadLocations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getLocations();

      const data = response?.data ?? response ?? [];

      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to load locations."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return locations.filter((location) => {
      const matchesSearch =
        !query ||
        location.locationCode
          ?.toLowerCase()
          .includes(query) ||
        location.name
          ?.toLowerCase()
          .includes(query) ||
        location.city
          ?.toLowerCase()
          .includes(query) ||
        location.state
          ?.toLowerCase()
          .includes(query) ||
        location.address
          ?.toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        location.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [locations, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: locations.length,

      active: locations.filter(
        (location) => location.status === "ACTIVE"
      ).length,

      inactive: locations.filter(
        (location) => location.status === "INACTIVE"
      ).length,

      blocked: locations.filter(
        (location) => location.status === "BLOCKED"
      ).length,
    };
  }, [locations]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSelectedLocation(null);
    setError("");
    setModal("form");
  };

  const openEdit = (location) => {
    setSelectedLocation(location);

    setForm({
      locationCode: location.locationCode || "",
      name: location.name || "",
      address: location.address || "",
      city: location.city || "",
      state: location.state || "",
      country: location.country || "India",
      pincode: location.pincode || "",
      latitude:
        location.latitude !== undefined &&
        location.latitude !== null
          ? String(location.latitude)
          : "",
      longitude:
        location.longitude !== undefined &&
        location.longitude !== null
          ? String(location.longitude)
          : "",
      landmark: location.landmark || "",
    });

    setError("");
    setModal("form");
  };

  const openView = (location) => {
    setSelectedLocation(location);
    setModal("view");
  };

  const closeModal = () => {
    if (saving) return;

    setModal(null);
    setSelectedLocation(null);
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
      locationCode: form.locationCode.trim(),
      name: form.name.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      pincode: form.pincode.trim(),
      landmark: form.landmark.trim(),
    };

    if (form.latitude.trim() !== "") {
      payload.latitude = Number(form.latitude);
    }

    if (form.longitude.trim() !== "") {
      payload.longitude = Number(form.longitude);
    }

    return payload;
  };

  const validateForm = () => {
    if (!form.locationCode.trim()) {
      return "Location code is required.";
    }

    if (!form.name.trim()) {
      return "Location name is required.";
    }

    if (!form.address.trim()) {
      return "Address is required.";
    }

    if (!form.city.trim()) {
      return "City is required.";
    }

    if (!form.state.trim()) {
      return "State is required.";
    }

    if (
      form.latitude.trim() !== "" &&
      (Number.isNaN(Number(form.latitude)) ||
        Number(form.latitude) < -90 ||
        Number(form.latitude) > 90)
    ) {
      return "Latitude must be between -90 and 90.";
    }

    if (
      form.longitude.trim() !== "" &&
      (Number.isNaN(Number(form.longitude)) ||
        Number(form.longitude) < -180 ||
        Number(form.longitude) > 180)
    ) {
      return "Longitude must be between -180 and 180.";
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
      setSuccess("");

      const payload = buildPayload();

      if (selectedLocation) {
        await updateLocation(
          selectedLocation._id,
          payload
        );

        setSuccess(
          "Location updated successfully."
        );
      } else {
        await createLocation(payload);

        setSuccess(
          "Location created successfully."
        );
      }

      await loadLocations();

      setModal(null);
      setSelectedLocation(null);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to save location."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (
    location,
    newStatus
  ) => {
    if (location.status === newStatus) return;

    try {
      setError("");
      setSuccess("");

      await updateLocationStatus(
        location._id,
        newStatus
      );

      setSuccess(
        `Location status changed to ${newStatus}.`
      );

      await loadLocations();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to update location status."
      );
    }
  };

  const handleDelete = async (location) => {
    const confirmed = window.confirm(
      `Delete location "${location.name}"?\n\nThis action can fail if the location is currently being used by an event or guest.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteLocation(location._id);

      setSuccess(
        "Location deleted successfully."
      );

      await loadLocations();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete location."
      );
    }
  };

  return (
    <div className="location-page">
      <div className="location-page__header">
        <div>
          <p className="location-page__eyebrow">
            OPERATIONS
          </p>

          <h1>Location Management</h1>

          <p className="location-page__subtitle">
            Manage event venues and operational locations.
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            className="location-btn location-btn--primary"
            onClick={openCreate}
          >
            + Add Location
          </button>
        )}
      </div>

      {error && (
        <div className="location-alert location-alert--error">
          {error}
          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="location-alert location-alert--success">
          {success}
          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}

      <div className="location-stats">
        <div className="location-stat">
          <span>Total Locations</span>
          <strong>{stats.total}</strong>
        </div>

        <div className="location-stat">
          <span>Active</span>
          <strong>{stats.active}</strong>
        </div>

        <div className="location-stat">
          <span>Inactive</span>
          <strong>{stats.inactive}</strong>
        </div>

        <div className="location-stat">
          <span>Blocked</span>
          <strong>{stats.blocked}</strong>
        </div>
      </div>

      <section className="location-card">
        <div className="location-toolbar">
          <div className="location-search">
            <input
              type="text"
              placeholder="Search by code, name, city or state..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="ALL">All Statuses</option>

            {STATUS_OPTIONS.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="location-table-wrapper">
          {loading ? (
            <div className="location-empty">
              Loading locations...
            </div>
          ) : filteredLocations.length === 0 ? (
            <div className="location-empty">
              <strong>No locations found</strong>
              <span>
                Try changing your search or add a new
                location.
              </span>
            </div>
          ) : (
            <table className="location-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Location</th>
                  <th>City</th>
                  <th>State</th>
                  <th>Status</th>
                  <th>Coordinates</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredLocations.map(
                  (location) => (
                    <tr key={location._id}>
                      <td>
                        <span className="location-code">
                          {location.locationCode}
                        </span>
                      </td>

                      <td>
                        <div className="location-name">
                          {location.name}
                        </div>

                        {location.landmark && (
                          <small>
                            {location.landmark}
                          </small>
                        )}
                      </td>

                      <td>{location.city}</td>

                      <td>{location.state}</td>

                      <td>
                        <span
                          className={`location-status location-status--${String(
                            location.status || ""
                          ).toLowerCase()}`}
                        >
                          {location.status}
                        </span>
                      </td>

                      <td>
                        {location.latitude !==
                          undefined &&
                        location.latitude !== null &&
                        location.longitude !==
                          undefined &&
                        location.longitude !==
                          null ? (
                          <span className="location-coordinates">
                            {Number(
                              location.latitude
                            ).toFixed(4)}
                            ,{" "}
                            {Number(
                              location.longitude
                            ).toFixed(4)}
                          </span>
                        ) : (
                          <span className="location-muted">
                            Not provided
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="location-actions">
                          <button
                            type="button"
                            onClick={() =>
                              openView(location)
                            }
                          >
                            View
                          </button>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                openEdit(location)
                              }
                            >
                              Edit
                            </button>
                          )}

                          {canManage && (
                            <select
                              value={
                                location.status || ""
                              }
                              onChange={(event) =>
                                handleStatusChange(
                                  location,
                                  event.target.value
                                )
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
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="location-action-delete"
                              onClick={() =>
                                handleDelete(location)
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
          )}
        </div>
      </section>

      {modal === "form" && (
        <div className="location-modal-backdrop">
          <div className="location-modal">
            <div className="location-modal__header">
              <div>
                <p className="location-page__eyebrow">
                  LOCATION
                </p>

                <h2>
                  {selectedLocation
                    ? "Edit Location"
                    : "Add Location"}
                </h2>
              </div>

              <button
                type="button"
                className="location-modal__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="location-form"
            >
              {error && (
                <div className="location-form-error">
                  {error}
                </div>
              )}

              <div className="location-form-grid">
                <div className="location-field">
                  <label>
                    Location Code *
                  </label>

                  <input
                    name="locationCode"
                    value={form.locationCode}
                    onChange={handleChange}
                    placeholder="e.g. PUNE01"
                    required
                  />
                </div>

                <div className="location-field">
                  <label>
                    Location Name *
                  </label>

                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Pune Convention Centre"
                    required
                  />
                </div>

                <div className="location-field location-field--full">
                  <label>Address *</label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Complete address"
                    rows="3"
                    required
                  />
                </div>

                <div className="location-field">
                  <label>City *</label>

                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Pune"
                    required
                  />
                </div>

                <div className="location-field">
                  <label>State *</label>

                  <input
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                    required
                  />
                </div>

                <div className="location-field">
                  <label>Country</label>

                  <input
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    placeholder="India"
                  />
                </div>

                <div className="location-field">
                  <label>Pincode</label>

                  <input
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="411001"
                  />
                </div>

                <div className="location-field">
                  <label>Latitude</label>

                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={form.latitude}
                    onChange={handleChange}
                    placeholder="18.5204"
                  />
                </div>

                <div className="location-field">
                  <label>Longitude</label>

                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={form.longitude}
                    onChange={handleChange}
                    placeholder="73.8567"
                  />
                </div>

                <div className="location-field location-field--full">
                  <label>Landmark</label>

                  <input
                    name="landmark"
                    value={form.landmark}
                    onChange={handleChange}
                    placeholder="Nearby landmark"
                  />
                </div>
              </div>

              <div className="location-form-actions">
                <button
                  type="button"
                  className="location-btn location-btn--secondary"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="location-btn location-btn--primary"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : selectedLocation
                    ? "Update Location"
                    : "Create Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === "view" && selectedLocation && (
        <div className="location-modal-backdrop">
          <div className="location-modal location-modal--view">
            <div className="location-modal__header">
              <div>
                <p className="location-page__eyebrow">
                  LOCATION DETAILS
                </p>

                <h2>
                  {selectedLocation.name}
                </h2>
              </div>

              <button
                type="button"
                className="location-modal__close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="location-details">
              <div className="location-detail">
                <span>Location Code</span>
                <strong>
                  {selectedLocation.locationCode}
                </strong>
              </div>

              <div className="location-detail">
                <span>Status</span>
                <strong>
                  {selectedLocation.status}
                </strong>
              </div>

              <div className="location-detail location-detail--full">
                <span>Address</span>
                <strong>
                  {selectedLocation.address}
                </strong>
              </div>

              <div className="location-detail">
                <span>City</span>
                <strong>
                  {selectedLocation.city}
                </strong>
              </div>

              <div className="location-detail">
                <span>State</span>
                <strong>
                  {selectedLocation.state}
                </strong>
              </div>

              <div className="location-detail">
                <span>Country</span>
                <strong>
                  {selectedLocation.country ||
                    "India"}
                </strong>
              </div>

              <div className="location-detail">
                <span>Pincode</span>
                <strong>
                  {selectedLocation.pincode ||
                    "Not provided"}
                </strong>
              </div>

              <div className="location-detail">
                <span>Landmark</span>
                <strong>
                  {selectedLocation.landmark ||
                    "Not provided"}
                </strong>
              </div>

              <div className="location-detail">
                <span>Latitude</span>
                <strong>
                  {selectedLocation.latitude ??
                    "Not provided"}
                </strong>
              </div>

              <div className="location-detail">
                <span>Longitude</span>
                <strong>
                  {selectedLocation.longitude ??
                    "Not provided"}
                </strong>
              </div>
            </div>

            <div className="location-form-actions">
              <button
                type="button"
                className="location-btn location-btn--secondary"
                onClick={closeModal}
              >
                Close
              </button>

              {canManage && (
                <button
                  type="button"
                  className="location-btn location-btn--primary"
                  onClick={() =>
                    openEdit(selectedLocation)
                  }
                >
                  Edit Location
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LocationManagement;