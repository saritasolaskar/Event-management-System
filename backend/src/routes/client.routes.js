const express = require("express");

const clientController = require("../controllers/client.controller");

const validate = require("../middleware/validate");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const { ROLES } = require("../constants/roles");

const {
  createClientValidator,
  updateClientValidator,
  clientIdValidator,
} = require("../validators/client.validator");

const router = express.Router();

/**
 * Create Client
 */
router.post(
  "/",
  protect,
  authorize(ROLES.ADMIN),
  createClientValidator,
  validate,
  clientController.createClient
);

/**
 * Get All Clients
 */
router.get(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  clientController.getAllClients
);

/**
 * Get Client By ID
 */
router.get(
  "/:id",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  clientIdValidator,
  validate,
  clientController.getClientById
);

/**
 * Update Client
 */
router.put(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  clientIdValidator,
  updateClientValidator,
  validate,
  clientController.updateClient
);

/**
 * Delete Client
 */
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  clientIdValidator,
  validate,
  clientController.deleteClient
);

/**
 * Update Client Status
 */
router.patch(
  "/:id/status",
  protect,
  authorize(ROLES.ADMIN),
  clientIdValidator,
  validate,
  clientController.updateClientStatus
);

module.exports = router;