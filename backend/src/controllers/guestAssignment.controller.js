const guestAssignmentService = require("../services/guestAssignment.service");

const asyncHandler = require("../utils/asyncHandler");

const {
    successResponse,
} = require("../utils/response.utils");

const createGuestAssignment = asyncHandler(
    async (req, res) => {
        const assignment =
            await guestAssignmentService.createGuestAssignment(
                req.body,
                req.user._id
            );

        return successResponse(
            res,
            201,
            "Guest assigned successfully.",
            assignment
        );
    }
);

const bulkAssignGuests = asyncHandler(
    async (req, res) => {
        const assignments =
            await guestAssignmentService.bulkAssignGuests(
                req.body.vehicleAssignment,
                req.body.guests,
                req.user._id
            );

        return successResponse(
            res,
            201,
            "Guests assigned successfully.",
            assignments
        );
    }
);

const getAllGuestAssignments = asyncHandler(
    async (req, res) => {
        const assignments =
            await guestAssignmentService.getAllGuestAssignments();

        return successResponse(
            res,
            200,
            "Guest assignments fetched successfully.",
            assignments
        );
    }
);

const getGuestAssignmentById = asyncHandler(
    async (req, res) => {
        const assignment =
            await guestAssignmentService.getGuestAssignmentById(
                req.params.id
            );

        return successResponse(
            res,
            200,
            "Guest assignment fetched successfully.",
            assignment
        );
    }
);

const updateGuestAssignment = asyncHandler(
    async (req, res) => {
        const assignment =
            await guestAssignmentService.updateGuestAssignment(
                req.params.id,
                req.body,
                req.user._id
            );

        return successResponse(
            res,
            200,
            "Guest assignment updated successfully.",
            assignment
        );
    }
);

const deleteGuestAssignment = asyncHandler(
    async (req, res) => {
        await guestAssignmentService.deleteGuestAssignment(
            req.params.id
        );

        return successResponse(
            res,
            200,
            "Guest assignment deleted successfully."
        );
    }
);

module.exports = {
    createGuestAssignment,
    bulkAssignGuests,
    getAllGuestAssignments,
    getGuestAssignmentById,
    updateGuestAssignment,
    deleteGuestAssignment,
};