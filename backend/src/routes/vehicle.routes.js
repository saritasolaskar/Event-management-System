const express = require("express");

const vehicleController = require("../controllers/vehicle.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
  createVehicleValidator,
  updateVehicleValidator,
  vehicleIdValidator,
} = require("../validators/vehicle.validator");

const router = express.Router();

/**
 * Create Vehicle
 */
router.post(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  createVehicleValidator,
  validate,
  vehicleController.createVehicle
);

/**
 * Get All Vehicles
 */
router.get(
  "/",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER
  ),
  vehicleController.getAllVehicles
);

/**
 * Get Vehicle By ID
 */
router.get(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER
  ),
  vehicleIdValidator,
  validate,
  vehicleController.getVehicleById
);

/**
 * Update Vehicle
 */
router.put(
  "/:id",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  updateVehicleValidator,
  validate,
  vehicleController.updateVehicle
);

/**
 * Delete Vehicle
 */
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  vehicleIdValidator,
  validate,
  vehicleController.deleteVehicle
);

/**
 * Update Vehicle Status
 */
router.patch(
  "/:id/status",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  vehicleIdValidator,
  validate,
  vehicleController.updateVehicleStatus
);

module.exports = router;