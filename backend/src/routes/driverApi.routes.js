const express = require("express");

const router = express.Router();

const driverApiController =
    require("../controllers/driverApi.controller");

const protect =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/authorize.middleware");

const validate =
    require("../middleware/validate");

const { ROLES } =
    require("../constants/roles");

const {
    guestAssignmentIdValidator,
} = require("../validators/guestAssignment.validator");

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
    guestAssignmentIdValidator,
    validate,
    driverApiController.markDriverEnRoute
);

/**
 * Guest Picked
 */
router.patch(
    "/guest/:id/picked",
    guestAssignmentIdValidator,
    validate,
    driverApiController.markGuestPicked
);

/**
 * Venue Reached
 */
router.patch(
    "/guest/:id/venue",
    guestAssignmentIdValidator,
    validate,
    driverApiController.markVenueReached
);

/**
 * Return Pickup
 */
router.patch(
    "/guest/:id/return-pickup",
    guestAssignmentIdValidator,
    validate,
    driverApiController.markReturnPickup
);

/**
 * Guest Dropped
 */
router.patch(
    "/guest/:id/dropped",
    guestAssignmentIdValidator,
    validate,
    driverApiController.markGuestDropped
);

module.exports = router;