const guestAssignmentRepository = require("../repositories/guestAssignment.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const guestRepository = require("../repositories/guest.repository");

const AppError = require("../utils/appError");

/**
 * Create Guest Assignment
 */
const createGuestAssignment = async (data, userId) => {
    const vehicleAssignment =
        await vehicleAssignmentRepository.findById(
            data.vehicleAssignment
        );

    if (!vehicleAssignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    const guest = await guestRepository.findById(data.guest);

    if (!guest) {
        throw new AppError("Guest not found.", 404);
    }

    const alreadyAssigned =
        await guestAssignmentRepository.findByGuest(
            data.guest
        );

    if (alreadyAssigned) {
        throw new AppError(
            "Guest is already assigned to a vehicle.",
            400
        );
    }

    data.createdBy = userId;
    data.updatedBy = userId;

    return await guestAssignmentRepository.create(data);
};

/**
 * Bulk Assign Guests
 */
const bulkAssignGuests = async (
    vehicleAssignmentId,
    guestIds,
    userId
) => {
    const vehicleAssignment =
        await vehicleAssignmentRepository.findById(
            vehicleAssignmentId
        );

    if (!vehicleAssignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    const assignments = [];

    for (let i = 0; i < guestIds.length; i++) {
        const guestId = guestIds[i];

        const guest =
            await guestRepository.findById(guestId);

        if (!guest) continue;

        const alreadyAssigned =
            await guestAssignmentRepository.findByGuest(
                guestId
            );

        if (alreadyAssigned) continue;

        const assignment =
            await guestAssignmentRepository.create({
                vehicleAssignment: vehicleAssignmentId,
                guest: guestId,
                pickupSequence: i + 1,
                dropSequence: i + 1,
                createdBy: userId,
                updatedBy: userId,
            });

        assignments.push(assignment);
    }

    return assignments;
};

/**
 * Get All
 */
const getAllGuestAssignments = async () => {
    return await guestAssignmentRepository.findAll();
};

/**
 * Get By ID
 */
const getGuestAssignmentById = async (id) => {
    const assignment =
        await guestAssignmentRepository.findById(id);

    if (!assignment) {
        throw new AppError(
            "Guest Assignment not found.",
            404
        );
    }

    return assignment;
};

/**
 * Update
 */
const updateGuestAssignment = async (
    id,
    updateData,
    userId
) => {
    const assignment =
        await guestAssignmentRepository.findById(id);

    if (!assignment) {
        throw new AppError(
            "Guest Assignment not found.",
            404
        );
    }

    updateData.updatedBy = userId;

    return await guestAssignmentRepository.updateById(
        id,
        updateData
    );
};

/**
 * Delete
 */
const deleteGuestAssignment = async (id) => {
    const assignment =
        await guestAssignmentRepository.findById(id);

    if (!assignment) {
        throw new AppError(
            "Guest Assignment not found.",
            404
        );
    }

    return await guestAssignmentRepository.softDelete(
        id
    );
};

module.exports = {
    createGuestAssignment,
    bulkAssignGuests,
    getAllGuestAssignments,
    getGuestAssignmentById,
    updateGuestAssignment,
    deleteGuestAssignment,
};