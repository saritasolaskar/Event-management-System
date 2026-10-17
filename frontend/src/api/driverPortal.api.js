
import api from "./axios";

export const getDriverDashboard = async () => {
  const response = await api.get("/driver/dashboard");
  return response.data;
};

export const getAssignedGuests = async () => {
  const response = await api.get("/driver/guests");
  return response.data;
};

export const markDriverEnRoute = async (id) => {
  const response = await api.patch(`/driver/guest/${id}/enroute`);
  return response.data;
};

export const markGuestPicked = async (id) => {
  const response = await api.patch(`/driver/guest/${id}/picked`);
  return response.data;
};

export const markVenueReached = async (id) => {
  const response = await api.patch(`/driver/guest/${id}/venue`);
  return response.data;
};

export const markReturnPickup = async (id) => {
  const response = await api.patch(
    `/driver/guest/${id}/return-pickup`
  );
  return response.data;
};

export const markGuestDropped = async (id) => {
  const response = await api.patch(`/driver/guest/${id}/dropped`);
  return response.data;
};
