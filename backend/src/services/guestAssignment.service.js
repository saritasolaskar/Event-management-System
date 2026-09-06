const guestAssignmentRepository = require("../repositories/guestAssignment.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const guestRepository = require("../repositories/guest.repository");

const notificationService = require("./notification.service");
const auditLogService = require("./auditLog.service");
const {
    PICKUP_STATUS,
    RETURN_STATUS,
} = require("../constants/status");
const AppError = require("../utils/AppError");

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
    
    if (
    vehicleAssignment.status !== "ASSIGNED" &&
    vehicleAssignment.status !== "ON_DUTY"
) {
    throw new AppError(
        "Guest can only be assigned to an active Vehicle Assignment.",
        400
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

    if (
    vehicleAssignment.status !== "ASSIGNED" &&
    vehicleAssignment.status !== "ON_DUTY"
) {
    throw new AppError(
        "Guests can only be assigned to an active Vehicle Assignment.",
        400
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
    data,
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

    // Do not modify an assignment after pickup has started
    if (
    assignment.pickupStatus !== PICKUP_STATUS.PENDING ||
    assignment.returnStatus !== RETURN_STATUS.NOT_STARTED
){
        throw new AppError(
            "Guest Assignment cannot be modified after the trip has started.",
            400
        );
    }

    const updateData = {};

    if (data.vehicleAssignment) {
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

        if (
            vehicleAssignment.status !== "ASSIGNED" &&
            vehicleAssignment.status !== "ON_DUTY"
        ) {
            throw new AppError(
                "Guest can only be assigned to an active Vehicle Assignment.",
                400
            );
        }

        const currentGuest =
            data.guest || assignment.guest?._id || assignment.guest;

        const guest =
            await guestRepository.findById(currentGuest);

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

        if (
            vehicleAssignment._id.toString() !==
            (
                assignment.vehicleAssignment?._id ||
                assignment.vehicleAssignment
            ).toString()
        ) {
            const existingAssignment =
                await guestAssignmentRepository.findByGuest(
                    currentGuest
                );

            if (
                existingAssignment &&
                existingAssignment._id.toString() !== id.toString()
            ) {
                throw new AppError(
                    "Guest is already assigned to another vehicle.",
                    400
                );
            }
        }

        updateData.vehicleAssignment =
            data.vehicleAssignment;
    }

    if (data.guest) {
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

        const vehicleAssignment =
            data.vehicleAssignment
                ? await vehicleAssignmentRepository.findById(
                      data.vehicleAssignment
                  )
                : assignment.vehicleAssignment;

        if (
            guest.event.toString() !==
            vehicleAssignment.event.toString()
        ) {
            throw new AppError(
                "Guest and Vehicle Assignment must belong to the same event.",
                400
            );
        }

        const existingAssignment =
            await guestAssignmentRepository.findByGuest(
                data.guest
            );

        if (
            existingAssignment &&
            existingAssignment._id.toString() !== id.toString()
        ) {
            throw new AppError(
                "Guest is already assigned to another vehicle.",
                400
            );
        }

        updateData.guest = data.guest;
    }

    if (data.pickupSequence !== undefined) {
        updateData.pickupSequence =
            data.pickupSequence;
    }

    if (data.dropSequence !== undefined) {
        updateData.dropSequence =
            data.dropSequence;
    }

    if (data.remarks !== undefined) {
        updateData.remarks =
            data.remarks;
    }

    updateData.updatedBy = userId;

    const updatedAssignment =
        await guestAssignmentRepository.updateById(
            id,
            updateData
        );

    if (!updatedAssignment) {
        throw new AppError(
            "Failed to update Guest Assignment.",
            500
        );
    }

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
        await guestAssignmentRepository.findById(id);

    if (!assignment) {
        throw new AppError(
            "Guest Assignment not found.",
            404
        );
    }

    if (
    assignment.pickupStatus !== PICKUP_STATUS.PENDING ||
    assignment.returnStatus !== RETURN_STATUS.NOT_STARTED
) {
        throw new AppError(
            "Guest Assignment cannot be deleted after the trip has started.",
            400
        );
    }

    const deletedAssignment =
        await guestAssignmentRepository.softDelete(id);

    if (!deletedAssignment) {
        throw new AppError(
            "Failed to delete Guest Assignment.",
            500
        );
    }

    await auditLogService.createLog({
        user: userId,
        action: "DELETE",
        module: "GUEST_ASSIGNMENT",
        referenceId: assignment._id,
        description: "Deleted guest assignment.",
    });

    return deletedAssignment;
};

module.exports = {

    createGuestAssignment,

    bulkAssignGuests,

    getAllGuestAssignments,

    getGuestAssignmentById,

    updateGuestAssignment,

    deleteGuestAssignment,

};