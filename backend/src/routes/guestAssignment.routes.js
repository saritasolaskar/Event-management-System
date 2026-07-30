const express = require("express");

const router = express.Router();

const guestAssignmentController = require("../controllers/guestAssignment.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
    createGuestAssignmentValidator,
    updateGuestAssignmentValidator,
    guestAssignmentIdValidator,
} = require("../validators/guestAssignment.validator");

/**
 * Create Assignment
 */
router.post(
    "/",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    createGuestAssignmentValidator,
    validate,
    guestAssignmentController.createGuestAssignment
);

/**
 * Bulk Assign Guests
 */
router.post(
    "/bulk",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    guestAssignmentController.bulkAssignGuests
);

/**
 * Get All Assignments
 */
router.get(
    "/",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER,
        ROLES.DISPATCHER
    ),
    guestAssignmentController.getAllGuestAssignments
);

/**
 * Get Assignment By ID
 */
router.get(
    "/:id",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER,
        ROLES.DISPATCHER
    ),
    guestAssignmentIdValidator,
    validate,
    guestAssignmentController.getGuestAssignmentById
);

/**
 * Update Assignment
 */
router.put(
    "/:id",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    guestAssignmentIdValidator,
    updateGuestAssignmentValidator,
    validate,
    guestAssignmentController.updateGuestAssignment
);

/**
 * Delete Assignment
 */
router.delete(
    "/:id",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    guestAssignmentIdValidator,
    validate,
    guestAssignmentController.deleteGuestAssignment
);

module.exports = router;