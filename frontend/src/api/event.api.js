import api from "./axios";

export const getEvents = async () => {
  const response = await api.get("/events");

  return response.data;
};

export const getEventById = async (id) => {
  const response = await api.get(`/events/${id}`);

  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await api.post("/events", eventData);

  return response.data;
};

export const updateEvent = async (id, eventData) => {
  const response = await api.put(`/events/${id}`, eventData);

  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await api.delete(`/events/${id}`);

  return response.data;
};

export const updateEventStatus = async (id, status) => {
  const response = await api.patch(`/events/${id}/status`, {
    status,
  });

  return response.data;
};