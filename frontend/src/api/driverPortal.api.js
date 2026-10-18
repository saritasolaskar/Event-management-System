
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

/**
 * Start duty with the assigned vehicle and starting odometer reading.
 */
export const startDriverDuty = async (vehicleAssignment, startKm) => {
  const response = await api.post("/duties", {
    vehicleAssignment,
    startKm: Number(startKm),
  });

  return response.data;
};

/**
 * Complete an active duty with the ending odometer reading.
 */
export const completeDriverDuty = async (dutyId, endKm) => {
  const response = await api.patch(`/duties/${dutyId}/complete`, {
    endKm: Number(endKm),
  });

  return response.data;
};

/**
 * Save expenses recorded against an active duty.
 */
export const updateDriverDutyExpenses = async (dutyId, expenses) => {
  const response = await api.patch(
    `/duties/${dutyId}/expenses`,
    expenses
  );

  return response.data;
};
