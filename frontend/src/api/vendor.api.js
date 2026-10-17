import api from "./axios";

export const getVendors = async () => {
  const response = await api.get("/vendors");
  return response.data;
};

export const getVendorById = async (id) => {
  const response = await api.get(`/vendors/${id}`);
  return response.data;
};

export const createVendor = async (vendorData) => {
  const response = await api.post("/vendors", vendorData);
  return response.data;
};

export const updateVendor = async (id, vendorData) => {
  const response = await api.put(`/vendors/${id}`, vendorData);
  return response.data;
};

export const deleteVendor = async (id) => {
  const response = await api.delete(`/vendors/${id}`);
  return response.data;
};

export const updateVendorStatus = async (id, status) => {
  const response = await api.patch(`/vendors/${id}/status`, {
    status,
  });
  return response.data;
};