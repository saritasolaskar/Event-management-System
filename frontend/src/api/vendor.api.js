import api from "./axios";

export const getVendors = async () => {
  const response = await api.get("/vendors");

  return response.data;
};

export const getVendorById = async (id) => {
  const response = await api.get(`/vendors/${id}`);

  return response.data;
};