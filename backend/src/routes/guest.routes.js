const express = require("express");

const guestController = require("../controllers/guest.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
    createGuestValidator,
    updateGuestValidator,
    guestIdValidator,
    eventIdValidator,
} = require("../validators/guest.validator");

const router = express.Router();

/**
 * Create Guest
 */
router.post(
    "/",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    createGuestValidator,
    validate,
    guestController.createGuest
);

/**
 * Get All Guests
 */
router.get(
    "/",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER,
        ROLES.DISPATCHER
    ),
    guestController.getAllGuests
);

/**
 * Get Guests By Event
 */
router.get(
    "/event/:eventId",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER,
        ROLES.DISPATCHER
    ),
    eventIdValidator,
    validate,
    guestController.getGuestsByEvent
);

/**
 * Get Guest By ID
 */
router.get(
    "/:id",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER,
        ROLES.DISPATCHER
    ),
    guestIdValidator,
    validate,
    guestController.getGuestById
);

/**
 * Update Guest
 */
router.put(
    "/:id",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    guestIdValidator,
    updateGuestValidator,
    validate,
    guestController.updateGuest
);

/**
 * Delete Guest
 */
router.delete(
    "/:id",
    protect,
    authorize(ROLES.ADMIN),
    guestIdValidator,
    validate,
    guestController.deleteGuest
);

/**
 * Update Guest Status
 */
router.patch(
    "/:id/status",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    guestIdValidator,
    validate,
    guestController.updateGuestStatus
);

module.exports = router;