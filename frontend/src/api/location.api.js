import api from "./axios";

export const getLocations = async () => {
  const response = await api.get("/locations");

  return response.data;
};

export const getLocationById = async (id) => {
  const response = await api.get(`/locations/${id}`);

  return response.data;
};

export const createLocation = async (locationData) => {
  const response = await api.post("/locations", locationData);

  return response.data;
};

export const updateLocation = async (id, locationData) => {
  const response = await api.put(`/locations/${id}`, locationData);

  return response.data;
};

export const deleteLocation = async (id) => {
  const response = await api.delete(`/locations/${id}`);

  return response.data;
};

export const updateLocationStatus = async (id, status) => {
  const response = await api.patch(`/locations/${id}/status`, {
    status,
  });

  return response.data;
};