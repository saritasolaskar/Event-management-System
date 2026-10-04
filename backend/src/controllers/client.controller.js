const clientService =
  require("../services/client.service");

const asyncHandler =
  require("../utils/asyncHandler");

const {
  successResponse,
} = require("../utils/response.utils");

/**
 * Create Client
 */
const createClient =
  asyncHandler(
    async (req, res) => {

      const result =
        await clientService.createClient(
          req.body,
          req.user._id
        );

      return successResponse(
        res,
        201,
        "Client and portal account created successfully.",
        result
      );
    }
  );

/**
 * Get All Clients
 */
const getAllClients =
  asyncHandler(
    async (req, res) => {

      const clients =
        await clientService.getAllClients();

      return successResponse(
        res,
        200,
        "Clients fetched successfully.",
        clients
      );
    }
  );

/**
 * Get Client By ID
 */
const getClientById =
  asyncHandler(
    async (req, res) => {

      const client =
        await clientService.getClientById(
          req.params.id
        );

      return successResponse(
        res,
        200,
        "Client fetched successfully.",
        client
      );
    }
  );

/**
 * Update Client
 */
const updateClient =
  asyncHandler(
    async (req, res) => {

      const client =
        await clientService.updateClient(
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
    }
  );

/**
 * Delete Client
 */
const deleteClient =
  asyncHandler(
    async (req, res) => {

      await clientService.deleteClient(
        req.params.id,
        req.user._id
      );

      return successResponse(
        res,
        200,
        "Client deleted successfully."
      );
    }
  );


  /**
 * Restore Client
 */
const restoreClient =
  asyncHandler(
    async (req, res) => {

      const result =
        await clientService.restoreClient(
          req.params.id,
          req.user._id
        );

      return successResponse(
        res,
        200,
        result.message,
        result.client
      );
    }
  );

/**
 * Update Client Status
 */
const updateClientStatus =
  asyncHandler(
    async (req, res) => {

      const client =
        await clientService.updateClientStatus(
          req.params.id,
          req.body.status,
          req.user._id
        );

      return successResponse(
        res,
        200,
        "Client status updated successfully.",
        client
      );
    }
  );

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  updateClientStatus,
  restoreClient,
};