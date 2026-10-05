import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getVehicles,
} from "../../api/vehicle.api";

import "../../styles/vehicle-management.css";

function unwrapResponse(response) {
  if (
    response?.data?.data !==
    undefined
  ) {
    return response.data.data;
  }

  if (
    response?.data !==
    undefined
  ) {
    return response.data;
  }

  return response;
}

function getVendorName(vehicle) {
  if (
    typeof vehicle?.vendor ===
    "object"
  ) {
    return (
      vehicle.vendor.companyName ||
      "-"
    );
  }

  return vehicle?.vendor || "-";
}

function getDriverName(vehicle) {
  if (
    !vehicle?.currentDriver
  ) {
    return "Unassigned";
  }

  if (
    typeof vehicle.currentDriver ===
    "object"
  ) {
    return [
      vehicle.currentDriver
        .firstName,
      vehicle.currentDriver
        .lastName,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return vehicle.currentDriver;
}

function VehicleManagement() {
  const [vehicles, setVehicles] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const loadVehicles =
    async () => {

      setLoading(true);
      setError("");

      try {

        const response =
          await getVehicles();

        const data =
          unwrapResponse(
            response
          );

        setVehicles(
          Array.isArray(data)
            ? data
            : []
        );

      } catch (err) {

        setError(
          err?.response?.data
            ?.message ||
          err?.message ||
          "Unable to load vehicles."
        );

      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadVehicles();
  }, []);

  const filteredVehicles =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return vehicles;
      }

      return vehicles.filter(
        (vehicle) =>
          vehicle.vehicleNumber
            ?.toLowerCase()
            .includes(query) ||
          getVendorName(vehicle)
            .toLowerCase()
            .includes(query) ||
          getDriverName(vehicle)
            .toLowerCase()
            .includes(query) ||
          vehicle.vehicleType
            ?.toLowerCase()
            .includes(query)
      );

    }, [
      vehicles,
      search,
    ]);

  return (
    <div className="vehicle-page">

      <div className="vehicle-page__header">
        <div>
          <h1>
            Vehicles
          </h1>

          <p>
            All vehicles registered
            through your events.
          </p>
        </div>

        <strong>
          Total: {vehicles.length}
        </strong>
      </div>

      {error && (
        <div className="vehicle-alert vehicle-alert--error">
          {error}
        </div>
      )}

      <div className="vehicle-toolbar">

        <input
          type="search"
          placeholder="Search vehicle, vendor or driver..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        <button
          type="button"
          className="vehicle-btn vehicle-btn--secondary"
          onClick={loadVehicles}
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
        ) : filteredVehicles.length ===
          0 ? (
          <div className="vehicle-empty">
            <h3>
              No vehicles found
            </h3>

            <p>
              Vehicles will appear
              here after they are
              added to an event.
            </p>
          </div>
        ) : (
          <div className="vehicle-table-wrapper">

            <table className="vehicle-table">

              <thead>
                <tr>
                  <th>
                    Vehicle Number
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Vendor
                  </th>

                  <th>
                    Driver
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Events
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredVehicles.map(
                  (vehicle) => (
                    <tr
                      key={
                        vehicle._id
                      }
                    >

                      <td>
                        <strong>
                          {
                            vehicle.vehicleNumber
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          vehicle.vehicleType
                        }
                      </td>

                      <td>
                        {
                          getVendorName(
                            vehicle
                          )
                        }
                      </td>

                      <td>
                        {
                          getDriverName(
                            vehicle
                          )
                        }
                      </td>

                      <td>
                        {
                          vehicle.status
                        }
                      </td>

                      <td>
                        {
                          vehicle.eventsUsedFor
                            ?.length || 0
                        }
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

    </div>
  );
}

export default VehicleManagement;