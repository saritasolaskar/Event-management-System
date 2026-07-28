const vehicleAssignmentService = require("../services/vehicleAssignment.service");

const asyncHandler = require("../utils/asyncHandler");

const {
    successResponse,
} = require("../utils/response.utils");

/**
 * Create Assignment
 */
const createVehicleAssignment = asyncHandler(
    async (req, res) => {

        const assignment =
            await vehicleAssignmentService.createVehicleAssignment(
                req.body,
                req.user._id
            );

        return successResponse(
            res,
            201,
            "Vehicle assignment created successfully.",
            assignment
        );
    }
);

/**
 * Get All Assignments
 */
const getAllVehicleAssignments = asyncHandler(
    async (req, res) => {

        const assignments =
            await vehicleAssignmentService.getAllVehicleAssignments();

        return successResponse(
            res,
            200,
            "Vehicle assignments fetched successfully.",
            assignments
        );
    }
);

/**
 * Get Assignment By ID
 */
const getVehicleAssignmentById = asyncHandler(
    async (req, res) => {

        const assignment =
            await vehicleAssignmentService.getVehicleAssignmentById(
                req.params.id
            );

        return successResponse(
            res,
            200,
            "Vehicle assignment fetched successfully.",
            assignment
        );
    }
);

/**
 * Update Assignment
 */
const updateVehicleAssignment = asyncHandler(
    async (req, res) => {

        const assignment =
            await vehicleAssignmentService.updateVehicleAssignment(
                req.params.id,
                req.body,
                req.user._id
            );

        return successResponse(
            res,
            200,
            "Vehicle assignment updated successfully.",
            assignment
        );
    }
);

/**
 * Delete Assignment
 */
const deleteVehicleAssignment = asyncHandler(
    async (req, res) => {

        await vehicleAssignmentService.deleteVehicleAssignment(
            req.params.id
        );

        return successResponse(
            res,
            200,
            "Vehicle assignment deleted successfully."
        );
    }
);

/**
 * Update Status
 */
const updateVehicleAssignmentStatus = asyncHandler(
    async (req, res) => {

        const assignment =
            await vehicleAssignmentService.updateVehicleAssignmentStatus(
                req.params.id,
                req.body.status
            );

        return successResponse(
            res,
            200,
            "Status updated successfully.",
            assignment
        );
    }
);

module.exports = {
    createVehicleAssignment,
    getAllVehicleAssignments,
    getVehicleAssignmentById,
    updateVehicleAssignment,
    deleteVehicleAssignment,
    updateVehicleAssignmentStatus,
};