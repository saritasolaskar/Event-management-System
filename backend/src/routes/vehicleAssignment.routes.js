
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
    updateVehicleAssignmentStatusValidator,
} = require("../validators/vehicleAssignment.validator");

const ASSIGNMENT_MANAGE_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
];

const ASSIGNMENT_READ_ROLES = [
    ...ASSIGNMENT_MANAGE_ROLES,
    ROLES.DISPATCHER,
];

// Create a vehicle duty assignment.
router.post(
    "/",
    protect,
    authorize(...ASSIGNMENT_MANAGE_ROLES),
    createVehicleAssignmentValidator,
    validate,
    vehicleAssignmentController.createVehicleAssignment
);

// Get all vehicle duty assignments.
router.get(
    "/",
    protect,
    authorize(...ASSIGNMENT_READ_ROLES),
    vehicleAssignmentController.getAllVehicleAssignments
);

// Get one vehicle duty assignment.
router.get(
    "/:id",
    protect,
    authorize(...ASSIGNMENT_READ_ROLES),
    vehicleAssignmentIdValidator,
    validate,
    vehicleAssignmentController.getVehicleAssignmentById
);

// Update an assignment before duty starts.
router.put(
    "/:id",
    protect,
    authorize(...ASSIGNMENT_MANAGE_ROLES),
    updateVehicleAssignmentValidator,
    validate,
    vehicleAssignmentController.updateVehicleAssignment
);

// Delete an assignment.
// Keep deletion restricted to administrators.
router.delete(
    "/:id",
    protect,
    authorize(
        ROLES.SUPER_ADMIN,
        ROLES.ADMIN
    ),
    vehicleAssignmentIdValidator,
    validate,
    vehicleAssignmentController.deleteVehicleAssignment
);

// Cancel an assignment.
router.patch(
    "/:id/status",
    protect,
    authorize(...ASSIGNMENT_MANAGE_ROLES),
    updateVehicleAssignmentStatusValidator,
    validate,
    vehicleAssignmentController.updateVehicleAssignmentStatus
);

module.exports = router;
