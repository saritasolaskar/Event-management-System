
import api from "./axios";

export const getVehicles = async () => {
  const response = await api.get("/vehicles");
  return response.data;
};

export const getVehicleById = async (id) => {
  const response = await api.get(`/vehicles/${id}`);
  return response.data;
};

export const createVehicle = async (vehicleData) => {
  const payload = {
    ...vehicleData,
    vehicleNumber: String(
      vehicleData?.vehicleNumber || ""
    )
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase(),
  };

  const response = await api.post("/vehicles", payload);
  return response.data;
};

export const updateVehicle = async (id, vehicleData) => {
  const payload = { ...vehicleData };

  if (
    Object.prototype.hasOwnProperty.call(
      payload,
      "vehicleNumber"
    )
  ) {
    payload.vehicleNumber = String(
      payload.vehicleNumber || ""
    )
      .trim()
      .replace(/\s+/g, "")
      .toUpperCase();
  }

  const response = await api.put(
    `/vehicles/${id}`,
    payload
  );

  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicles/${id}`);
  return response.data;
};

export const updateVehicleStatus = async (id, status) => {
  const response = await api.patch(
    `/vehicles/${id}/status`,
    { status }
  );

  return response.data;
};

export const getVehiclesByEvent = async (eventId) => {
  const response = await api.get(
    `/vehicles/event/${eventId}`
  );

  return response.data;
};

export const importEventVehicles = async (
  eventId,
  file
) => {
  const formData = new FormData();

  formData.append("eventId", eventId);
  formData.append("file", file);

  const response = await api.post(
    "/vehicles/import",
    formData
  );

  return response.data;
};
