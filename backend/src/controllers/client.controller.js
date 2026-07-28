const clientService = require("../services/client.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

/**
 * Create Client
 */
const createClient = asyncHandler(async (req, res) => {
  const client = await clientService.createClient(
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    201,
    "Client created successfully.",
    client
  );
});

/**
 * Get All Clients
 */
const getAllClients = asyncHandler(async (req, res) => {
  const clients = await clientService.getAllClients();

  return successResponse(
    res,
    200,
    "Clients fetched successfully.",
    clients
  );
});

/**
 * Get Client By ID
 */
const getClientById = asyncHandler(async (req, res) => {
  const client = await clientService.getClientById(
    req.params.id
  );

  return successResponse(
    res,
    200,
    "Client fetched successfully.",
    client
  );
});

/**
 * Update Client
 */
const updateClient = asyncHandler(async (req, res) => {
  const client = await clientService.updateClient(
    req.params.id,
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Client updated successfully.",
    client
  );
});

/**
 * Delete Client
 */
const deleteClient = asyncHandler(async (req, res) => {
  await clientService.deleteClient(req.params.id);

  return successResponse(
    res,
    200,
    "Client deleted successfully."
  );
});

/**
 * Update Client Status
 */
const updateClientStatus = asyncHandler(async (req, res) => {
  const client = await clientService.updateClientStatus(
    req.params.id,
    req.body.status
  );

  return successResponse(
    res,
    200,
    "Client status updated successfully.",
    client
  );
});

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  updateClientStatus,
};