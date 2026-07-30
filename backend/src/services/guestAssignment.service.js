const guestAssignmentRepository = require("../repositories/guestAssignment.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const guestRepository = require("../repositories/guest.repository");

const notificationService = require("./notification.service");
const auditLogService = require("./auditLog.service");

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

    const guest =
        await guestRepository.findById(
            data.guest
        );

    if (!guest) {
        throw new AppError(
            "Guest not found.",
            404
        );
    }

    if (
        guest.event.toString() !==
        vehicleAssignment.event.toString()
    ) {
        throw new AppError(
            "Guest and Vehicle Assignment must belong to the same event.",
            400
        );
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

    const assignment =
        await guestAssignmentRepository.create(
            data
        );

    await notificationService.createNotification({

        recipientUser: userId,

        title: "Guest Assigned",

        message: `${guest.name} assigned successfully.`,

        type: "GUEST_ASSIGNED",

        referenceType: "GUEST_ASSIGNMENT",

        referenceId: assignment._id,

    });

    await auditLogService.createLog({

        user: userId,

        action: "ASSIGN",

        module: "GUEST_ASSIGNMENT",

        referenceId: assignment._id,

        description: `Assigned guest ${guest.name} to vehicle.`,

    });

    return assignment;

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

    for (const [index, guestId] of guestIds.entries()) {

        const guest =
            await guestRepository.findById(
                guestId
            );

        if (!guest) {
            throw new AppError(
                `Guest not found: ${guestId}`,
                404
            );
        }

        if (
            guest.event.toString() !==
            vehicleAssignment.event.toString()
        ) {
            throw new AppError(
                `Guest ${guest.name} belongs to a different event.`,
                400
            );
        }

        const alreadyAssigned =
            await guestAssignmentRepository.findByGuest(
                guestId
            );

        if (alreadyAssigned) {
            throw new AppError(
                `Guest ${guest.name} is already assigned.`,
                400
            );
        }

        const assignment =
            await guestAssignmentRepository.create({

                vehicleAssignment:
                    vehicleAssignmentId,

                guest:
                    guestId,

                pickupSequence:
                    index + 1,

                dropSequence:
                    index + 1,

                createdBy:
                    userId,

                updatedBy:
                    userId,

            });

        await auditLogService.createLog({

            user: userId,

            action: "ASSIGN",

            module: "GUEST_ASSIGNMENT",

            referenceId: assignment._id,

            description: `Assigned guest ${guest.name}.`,

        });

        assignments.push(assignment);

    }

    return assignments;

};

/**
 * Get All Guest Assignments
 */
const getAllGuestAssignments = async () => {

    return guestAssignmentRepository.findAll();

};

/**
 * Get Guest Assignment By ID
 */
const getGuestAssignmentById = async (id) => {

    const assignment =
        await guestAssignmentRepository.findById(
            id
        );

    if (!assignment) {
        throw new AppError(
            "Guest Assignment not found.",
            404
        );
    }

    return assignment;

};

/**
 * Update Guest Assignment
 */
const updateGuestAssignment = async (

    id,

    updateData,

    userId

) => {

    const assignment =
        await guestAssignmentRepository.findById(
            id
        );

    if (!assignment) {
        throw new AppError(
            "Guest Assignment not found.",
            404
        );
    }

    if (updateData.vehicleAssignment) {

        const vehicleAssignment =
            await vehicleAssignmentRepository.findById(
                updateData.vehicleAssignment
            );

        if (!vehicleAssignment) {
            throw new AppError(
                "Vehicle Assignment not found.",
                404
            );
        }

    }

    if (updateData.guest) {

        const guest =
            await guestRepository.findById(
                updateData.guest
            );

        if (!guest) {
            throw new AppError(
                "Guest not found.",
                404
            );
        }

    }

    updateData.updatedBy = userId;

    const updatedAssignment =
        await guestAssignmentRepository.updateById(
            id,
            updateData
        );

    await auditLogService.createLog({

        user: userId,

        action: "UPDATE",

        module: "GUEST_ASSIGNMENT",

        referenceId: updatedAssignment._id,

        description: "Updated guest assignment.",

    });

    return updatedAssignment;

};

/**
 * Delete Guest Assignment
 */
const deleteGuestAssignment = async (

    id,

    userId

) => {

    const assignment =
        await guestAssignmentRepository.findById(
            id
        );

    if (!assignment) {
        throw new AppError(
            "Guest Assignment not found.",
            404
        );
    }

    await guestAssignmentRepository.softDelete(
        id
    );

    await auditLogService.createLog({

        user: userId,

        action: "DELETE",

        module: "GUEST_ASSIGNMENT",

        referenceId: assignment._id,

        description: "Deleted guest assignment.",

    });

};

module.exports = {

    createGuestAssignment,

    bulkAssignGuests,

    getAllGuestAssignments,

    getGuestAssignmentById,

    updateGuestAssignment,

    deleteGuestAssignment,

};