import api from "./axios";

export const getVehicleAssignments = async () => {
  const response = await api.get("/vehicle-assignments");
  return response.data;
};

export const createVehicleAssignment = async (assignmentData) => {
  const response = await api.post(
    "/vehicle-assignments",
    assignmentData
  );
  return response.data;
};

export const cancelVehicleAssignment = async (id) => {
  const response = await api.patch(
    `/vehicle-assignments/${id}/status`,
    { status: "CANCELLED" }
  );
  return response.data;
};