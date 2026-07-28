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
 * Get All
 */
router.get(
    "/",
    protect,
    guestAssignmentController.getAllGuestAssignments
);

/**
 * Get By ID
 */
router.get(
    "/:id",
    protect,
    guestAssignmentIdValidator,
    validate,
    guestAssignmentController.getGuestAssignmentById
);

/**
 * Update
 */
router.put(
    "/:id",
    protect,
    updateGuestAssignmentValidator,
    validate,
    guestAssignmentController.updateGuestAssignment
);

/**
 * Delete
 */
router.delete(
    "/:id",
    protect,
    guestAssignmentIdValidator,
    validate,
    guestAssignmentController.deleteGuestAssignment
);

module.exports = router;