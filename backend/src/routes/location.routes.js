const express = require("express");

const locationController = require("../controllers/location.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
  createLocationValidator,
  updateLocationValidator,
  locationIdValidator,
} = require("../validators/location.validator");

const router = express.Router();

/**
 * Create Location
 */
router.post(
  "/",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER
  ),
  createLocationValidator,
  validate,
  locationController.createLocation
);

/**
 * Get All Locations
 */
router.get(
  "/",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER,
    ROLES.CLIENT
  ),
  locationController.getAllLocations
);

/**
 * Get Location By ID
 */
router.get(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER,
    ROLES.CLIENT
  ),
  locationIdValidator,
  validate,
  locationController.getLocationById
);

/**
 * Update Location
 */
router.put(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER
  ),
  updateLocationValidator,
  validate,
  locationController.updateLocation
);

/**
 * Delete Location
 */
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  locationIdValidator,
  validate,
  locationController.deleteLocation
);

/**
 * Update Location Status
 */
router.patch(
  "/:id/status",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER
  ),
  locationIdValidator,
  validate,
  locationController.updateLocationStatus
);

module.exports = router;