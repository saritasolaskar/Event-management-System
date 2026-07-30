const express = require("express");

const eventController = require("../controllers/event.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
    createEventValidator,
    updateEventValidator,
    eventIdValidator,
} = require("../validators/event.validator");

const router = express.Router();

/**
 * Create Event
 */
router.post(
    "/",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    createEventValidator,
    validate,
    eventController.createEvent
);

/**
 * Get All Events
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
    eventController.getAllEvents
);

/**
 * Get Event By ID
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
    eventIdValidator,
    validate,
    eventController.getEventById
);

/**
 * Update Event
 */
router.put(
    "/:id",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    eventIdValidator,
    updateEventValidator,
    validate,
    eventController.updateEvent
);

/**
 * Delete Event
 */
router.delete(
    "/:id",
    protect,
    authorize(ROLES.ADMIN),
    eventIdValidator,
    validate,
    eventController.deleteEvent
);

/**
 * Update Event Status
 */
router.patch(
    "/:id/status",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    eventIdValidator,
    validate,
    eventController.updateEventStatus
);

module.exports = router;