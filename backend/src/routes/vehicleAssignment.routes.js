const express = require("express");

const router = express.Router();

const vehicleAssignmentController = require("../controllers/vehicleAssignment.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
    createVehicleAssignmentValidator,
    updateVehicleAssignmentValidator,
    vehicleAssignmentIdValidator,
} = require("../validators/vehicleAssignment.validator");

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
    createVehicleAssignmentValidator,
    validate,
    vehicleAssignmentController.createVehicleAssignment
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
    vehicleAssignmentController.getAllVehicleAssignments
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
    vehicleAssignmentIdValidator,
    validate,
    vehicleAssignmentController.getVehicleAssignmentById
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
    updateVehicleAssignmentValidator,
    validate,
    vehicleAssignmentController.updateVehicleAssignment
);

/**
 * Delete Assignment
 */
router.delete(
    "/:id",
    protect,
    authorize(
        ROLES.ADMIN
    ),
    vehicleAssignmentIdValidator,
    validate,
    vehicleAssignmentController.deleteVehicleAssignment
);

/**
 * Update Assignment Status
 */
router.patch(
    "/:id/status",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.OPERATIONS_MANAGER
    ),
    vehicleAssignmentIdValidator,
    validate,
    vehicleAssignmentController.updateVehicleAssignmentStatus
);

module.exports = router;