import api from "./axios";

export const getGuestAssignments = async () => {
  const response = await api.get("/guest-assignments");
  return response.data;
};

export const createGuestAssignment = async (assignmentData) => {
  const response = await api.post(
    "/guest-assignments",
    assignmentData
  );
  return response.data;
};

export const bulkAssignGuests = async (vehicleAssignment, guests) => {
  const response = await api.post("/guest-assignments/bulk", {
    vehicleAssignment,
    guests,
  });
  return response.data;
};

export const updateGuestAssignment = async (id, data) => {
  const response = await api.put(`/guest-assignments/${id}`, data);
  return response.data;
};

export const deleteGuestAssignment = async (id) => {
  const response = await api.delete(`/guest-assignments/${id}`);
  return response.data;
};