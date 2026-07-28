const express = require("express");

const router = express.Router();

const driverApiController = require("../controllers/driverApi.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const { ROLES } = require("../constants/roles");

router.use(
    protect,
    authorize(ROLES.DRIVER)
);

/**
 * Dashboard
 */
router.get(
    "/dashboard",
    driverApiController.getDriverDashboard
);

/**
 * Guest List
 */
router.get(
    "/guests",
    driverApiController.getAssignedGuests
);

/**
 * Driver En Route
 */
router.patch(
    "/guest/:id/enroute",
    driverApiController.markDriverEnRoute
);

/**
 * Guest Picked
 */
router.patch(
    "/guest/:id/picked",
    driverApiController.markGuestPicked
);

/**
 * Venue Reached
 */
router.patch(
    "/guest/:id/venue",
    driverApiController.markVenueReached
);

/**
 * Return Pickup
 */
router.patch(
    "/guest/:id/return-pickup",
    driverApiController.markReturnPickup
);

/**
 * Guest Dropped
 */
router.patch(
    "/guest/:id/dropped",
    driverApiController.markGuestDropped
);

module.exports = router;