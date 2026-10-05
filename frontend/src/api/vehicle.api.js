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
  const response = await api.post("/vehicles", vehicleData);

  return response.data;
};

export const updateVehicle = async (id, vehicleData) => {
  const response = await api.put(`/vehicles/${id}`, vehicleData);

  return response.data;
};

export const deleteVehicle = async (id) => {
  const response = await api.delete(`/vehicles/${id}`);

  return response.data;
};

export const updateVehicleStatus = async (id, status) => {
  const response = await api.patch(`/vehicles/${id}/status`, {
    status,
  });

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
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};