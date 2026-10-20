import api from "./axios";

export const getGuests = async () => {
  const response = await api.get("/guests");

  return response.data;
};

export const getGuestsByEvent = async (eventId) => {
  const response = await api.get(`/guests/event/${eventId}`);

  return response.data;
};

export const getGuestById = async (id) => {
  const response = await api.get(`/guests/${id}`);

  return response.data;
};

export const createGuest = async (guestData) => {
  const response = await api.post("/guests", guestData);

  return response.data;
};

export const updateGuest = async (id, guestData) => {
  const response = await api.put(`/guests/${id}`, guestData);

  return response.data;
};

export const deleteGuest = async (id) => {
  const response = await api.delete(`/guests/${id}`);

  return response.data;
};

export const updateGuestStatus = async (id, status) => {
  const response = await api.patch(`/guests/${id}/status`, {
    status,
  });

  return response.data;
};