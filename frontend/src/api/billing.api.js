import api from "./axios";

export const getClientInvoices = async () => {
  const response = await api.get("/client-invoices");
  return response.data;
};

export const getVendorBills = async () => {
  const response = await api.get("/vendor-bills");
  return response.data;
};

export const approveInvoice = (id, remarks = "") =>
  api.patch(`/billing-approval/invoice/${id}/approve`, { remarks });

export const rejectInvoice = (id, remarks = "") =>
  api.patch(`/billing-approval/invoice/${id}/reject`, { remarks });

export const shareInvoice = (id) =>
  api.patch(`/billing-approval/invoice/${id}/share`);

export const payInvoice = (id, paymentMode, paymentReference = "") =>
  api.patch(`/billing-approval/invoice/${id}/paid`, {
    paymentMode,
    paymentReference,
  });

export const approveVendorBill = (id, remarks = "") =>
  api.patch(`/billing-approval/vendor/${id}/approve`, { remarks });

export const rejectVendorBill = (id, remarks = "") =>
  api.patch(`/billing-approval/vendor/${id}/reject`, { remarks });

export const shareVendorBill = (id) =>
  api.patch(`/billing-approval/vendor/${id}/share`);

export const payVendorBill = (id, paymentMode, paymentReference = "") =>
  api.patch(`/billing-approval/vendor/${id}/paid`, {
    paymentMode,
    paymentReference,
  });

export const downloadInvoicePdf = async (id) => {
  const response = await api.get(`/client-invoices/${id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
};

export const downloadVendorBillPdf = async (id) => {
  const response = await api.get(`/vendor-bills/${id}/pdf`, {
    responseType: "blob",
  });
  return response.data;
};