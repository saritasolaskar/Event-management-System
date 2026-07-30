const express = require("express");

const driverController = require("../controllers/driver.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
  createDriverValidator,
  updateDriverValidator,
  driverIdValidator,
} = require("../validators/driver.validator");

const router = express.Router();

/**
 * Create Driver
 */
router.post(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  createDriverValidator,
  validate,
  driverController.createDriver
);

/**
 * Get All Drivers
 */
router.get(
  "/",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER
  ),
  driverController.getAllDrivers
);

/**
 * Get Driver By ID
 */
router.get(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER
  ),
  driverIdValidator,
  validate,
  driverController.getDriverById
);

/**
 * Update Driver
 */
router.put(
  "/:id",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  driverIdValidator,
  updateDriverValidator,
  validate,
  driverController.updateDriver
);

/**
 * Delete Driver
 */
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  driverIdValidator,
  validate,
  driverController.deleteDriver
);

/**
 * Update Driver Status
 */
router.patch(
  "/:id/status",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  driverIdValidator,
  validate,
  driverController.updateDriverStatus
);

module.exports = router;