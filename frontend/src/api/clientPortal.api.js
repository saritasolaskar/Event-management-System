
import api from "./axios";

export const getClientDashboard = async () => {
  const response = await api.get("/client-portal/dashboard");
  return response.data;
};

export const getClientEvents = async () => {
  const response = await api.get("/client-portal/events");
  return response.data;
};

export const getClientEventDetails = async (id) => {
  const response = await api.get(`/client-portal/events/${id}`);
  return response.data;
};

export const getClientEventOverview = async (id) => {
  const response = await api.get(
    `/client-portal/events/${id}/overview`
  );
  return response.data;
};

export const getClientInvoices = async () => {
  const response = await api.get("/client-portal/invoices");
  return response.data;
};

export const downloadClientInvoice = async (id) => {
  const response = await api.get(
    `/client-portal/invoices/${id}/download`,
    { responseType: "blob" }
  );

  return response.data;
};
