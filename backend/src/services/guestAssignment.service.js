
const mongoose = require("mongoose");

const guestAssignmentRepository = require("../repositories/guestAssignment.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const guestRepository = require("../repositories/guest.repository");

const notificationService = require("./notification.service");
const auditLogService = require("./auditLog.service");

const AppError = require("../utils/AppError");

const {
    VEHICLE_ASSIGNMENT_STATUS,
    PICKUP_STATUS,
    RETURN_STATUS,
} = require("../constants/status");


/**
 * Get a readable guest name.
 */
const getGuestDisplayName = (guest) => {
    if (!guest) {
        return "Guest";
    }

    return [
        guest.firstName,
        guest.lastName,
    ]
        .filter(Boolean)
        .join(" ") || "Guest";
};


/**
 * Validate that the vehicle assignment exists
 * and is still editable before duty starts.
 */
const validateVehicleAssignment = async (
    vehicleAssignmentId
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
        vehicleAssignment.status !==
        VEHICLE_ASSIGNMENT_STATUS.ASSIGNED
    ) {
        throw new AppError(
            "Guest can only be assigned before vehicle duty starts.",
            400
        );
    }

    return vehicleAssignment;
};


/**
 * Validate that the guest exists and belongs
 * to the same event as the vehicle assignment.
 */
const validateGuestForEvent = async (
    guestId,
    eventId
) => {
    const guest =
        await guestRepository.findById(
            guestId
        );

    if (!guest || guest.isDeleted) {
        throw new AppError(
            "Guest not found.",
            404
        );
    }

    const guestEventId =
        guest.event?._id ||
        guest.event;

    const targetEventId =
        eventId?._id ||
        eventId;

    if (
        !guestEventId ||
        !targetEventId ||
        guestEventId.toString() !==
            targetEventId.toString()
    ) {
        throw new AppError(
            "Guest and Vehicle Assignment must belong to the same event.",
            400
        );
    }

    return guest;
};


/**
 * Conditionally update the parent assignment inside
 * a transaction. The write makes the operation conflict
 * with concurrent duty-start transitions.
 */
const lockVehicleAssignmentForGuestChanges = async (
    vehicleAssignmentId,
    userId,
    session
) => {
    const lockedAssignment =
        await vehicleAssignmentRepository.updateByIdAndStatus(
            vehicleAssignmentId,
            VEHICLE_ASSIGNMENT_STATUS.ASSIGNED,
            {
                updatedBy: userId,
            },
            session
        );

    if (!lockedAssignment) {
        throw new AppError(
            "Guest assignments can only be changed before vehicle duty starts. Refresh and try again.",
            409
        );
    }

    return lockedAssignment;
};




const lockGuestForAssignment = async (
    guestId,
    session
) => {
    const guest =
        await guestRepository.lockForAssignment(
            guestId,
            session
        );

    if (!guest) {
        throw new AppError(
            "Guest not found or no longer available.",
            404
        );
    }

    return guest;
};



/**
 * Create a single Guest Assignment.
 */
const createGuestAssignment = async (
    data,
    userId
) => {
    const vehicleAssignment =
        await validateVehicleAssignment(
            data.vehicleAssignment
        );

    const guest =
        await validateGuestForEvent(
            data.guest,
            vehicleAssignment.event
        );

    const guestName =
        getGuestDisplayName(guest);

    const session =
        await mongoose.startSession();

    let assignment;

    try {
        await session.withTransaction(
            async () => {
                await lockVehicleAssignmentForGuestChanges(
                    data.vehicleAssignment,
                    userId,
                    session
                );

                await lockGuestForAssignment(
    data.guest,
    session
);

                const alreadyAssigned =
                    await guestAssignmentRepository.findActiveByGuest(
                        data.guest,
                        session
                    );

                if (alreadyAssigned) {
                    throw new AppError(
                        "Guest is already assigned to a vehicle.",
                        409
                    );
                }

                try {
                    assignment =
                        await guestAssignmentRepository.create(
                            {
                                ...data,
                                createdBy: userId,
                                updatedBy: userId,
                            },
                            session
                        );
                } catch (error) {
                    if (error.code === 11000) {
                        throw new AppError(
                            "Guest is already assigned to a vehicle.",
                            409
                        );
                    }

                    throw error;
                }
            }
        );
    } finally {
        await session.endSession();
    }

    // Side effects only after the transaction commits.
    await notificationService.createNotification({
        recipientUser: userId,
        title: "Guest Assigned",
        message: `${guestName} assigned successfully.`,
        type: "GUEST_ASSIGNED",
        referenceType: "GUEST_ASSIGNMENT",
        referenceId: assignment._id,
    });

    await auditLogService.createLog({
        user: userId,
        action: "ASSIGN",
        module: "GUEST_ASSIGNMENT",
        referenceId: assignment._id,
        description:
            `Assigned guest ${guestName} to vehicle.`,
    });

    return assignment;
};


/**
 * Bulk Assign Guests.
 *
 * All guest assignments succeed together or roll back together.
 */
const bulkAssignGuests = async (
    vehicleAssignmentId,
    guestIds,
    userId
) => {
    if (
        !Array.isArray(guestIds) ||
        guestIds.length === 0
    ) {
        throw new AppError(
            "At least one guest is required.",
            400
        );
    }

    const uniqueGuestIds = [
        ...new Set(
            guestIds.map((id) => id.toString())
        ),
    ];

    if (
        uniqueGuestIds.length !==
        guestIds.length
    ) {
        throw new AppError(
            "Duplicate guests are not allowed in the same bulk assignment.",
            400
        );
    }

    const vehicleAssignment =
        await validateVehicleAssignment(
            vehicleAssignmentId
        );

    const session =
        await mongoose.startSession();

    const assignments = [];

    try {
        await session.withTransaction(
            async () => {
                // MongoDB can retry a transaction callback.
                // Do not retain results from a previous attempt.
                assignments.length = 0;

                await lockVehicleAssignmentForGuestChanges(
                    vehicleAssignmentId,
                    userId,
                    session
                );

                // Lock guests in a stable order to reduce conflicts
// when overlapping bulk requests run concurrently.
for (const guestId of [...uniqueGuestIds].sort()) {
    await lockGuestForAssignment(
        guestId,
        session
    );
}

                for (
                    const [
                        index,
                        guestId,
                    ] of uniqueGuestIds.entries()
                ) {
                    const guest =
                        await validateGuestForEvent(
                            guestId,
                            vehicleAssignment.event
                        );

                    const guestName =
                        getGuestDisplayName(guest);

                    const alreadyAssigned =
                        await guestAssignmentRepository.findActiveByGuest(
                            guestId,
                            session
                        );

                    if (alreadyAssigned) {
                        throw new AppError(
                            `Guest ${guestName} is already assigned.`,
                            409
                        );
                    }

                    let assignment;

                    try {
                        assignment =
                            await guestAssignmentRepository.create(
                                {
                                    vehicleAssignment:
                                        vehicleAssignmentId,

                                    guest: guestId,

                                    pickupSequence:
                                        index + 1,

                                    dropSequence:
                                        index + 1,

                                    createdBy: userId,
                                    updatedBy: userId,
                                },
                                session
                            );
                    } catch (error) {
                        if (error.code === 11000) {
                            throw new AppError(
                                `Guest ${guestName} is already assigned.`,
                                409
                            );
                        }

                        throw error;
                    }

                    assignments.push(assignment);
                }
            }
        );
    } finally {
        await session.endSession();
    }

    // Audit and notify only after the transaction commits.
    for (const assignment of assignments) {
        await auditLogService.createLog({
            user: userId,
            action: "ASSIGN",
            module: "GUEST_ASSIGNMENT",
            referenceId: assignment._id,
            description:
                "Guest assigned through bulk assignment.",
        });
    }

    await notificationService.createNotification({
        recipientUser: userId,
        title: "Guests Assigned",
        message:
            `${assignments.length} guest(s) assigned successfully.`,
        type: "GUEST_ASSIGNED",
        referenceType: "GUEST_ASSIGNMENT",
        referenceId: vehicleAssignmentId,
    });

    return assignments;
};


/**
 * Get all Guest Assignments.
 */
const getAllGuestAssignments = async () => {
    return guestAssignmentRepository.findAll();
};


/**
 * Get Guest Assignment by ID.
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
 * Update a Guest Assignment.
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

    if (
        assignment.pickupStatus !== PICKUP_STATUS.PENDING ||
        assignment.returnStatus !== RETURN_STATUS.NOT_STARTED
    ) {
        throw new AppError(
            "Guest Assignment cannot be modified after the trip has started.",
            400
        );
    }

    const currentVehicleAssignmentId =
        assignment.vehicleAssignment?._id ||
        assignment.vehicleAssignment;

    const targetVehicleAssignmentId =
        data.vehicleAssignment ||
        currentVehicleAssignmentId;

    const targetVehicleAssignment =
        await validateVehicleAssignment(
            targetVehicleAssignmentId
        );

    const currentGuestId =
        assignment.guest?._id ||
        assignment.guest;

    const targetGuestId =
        data.guest ||
        currentGuestId;

    const guest =
        await validateGuestForEvent(
            targetGuestId,
            targetVehicleAssignment.event
        );

    const guestName =
        getGuestDisplayName(guest);

    const updateData = {
        updatedBy: userId,
    };

    if (data.vehicleAssignment !== undefined) {
        updateData.vehicleAssignment =
            data.vehicleAssignment;
    }

    if (data.guest !== undefined) {
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
        updateData.remarks = data.remarks;
    }

    // Lock both parent assignments in deterministic order.
    // This avoids inconsistent lock ordering when moving a guest.
    const assignmentIds = [
        ...new Set([
            currentVehicleAssignmentId.toString(),
            targetVehicleAssignmentId.toString(),
        ]),
    ].sort();

    const session =
        await mongoose.startSession();

    let updatedAssignment;

    try {
        await session.withTransaction(
            async () => {
                for (const vehicleAssignmentId of assignmentIds) {
                    await lockVehicleAssignmentForGuestChanges(
                        vehicleAssignmentId,
                        userId,
                        session
                    );
                }

                const guestChanged =
                    targetGuestId.toString() !==
                    currentGuestId.toString();

                const vehicleChanged =
                    targetVehicleAssignmentId.toString() !==
                    currentVehicleAssignmentId.toString();

                if (guestChanged || vehicleChanged) {
                    const existingAssignment =
                        await guestAssignmentRepository.findActiveByGuest(
                            targetGuestId,
                            session
                        );

                    if (
                        existingAssignment &&
                        existingAssignment._id.toString() !==
                            id.toString()
                    ) {
                        throw new AppError(
                            "Guest is already assigned to another vehicle.",
                            409
                        );
                    }
                }

                await lockGuestForAssignment(
    targetGuestId,
    session
);

                updatedAssignment =
                    await guestAssignmentRepository.updateByIdIfPending(
                        id,
                        updateData,
                        session
                    );

                if (!updatedAssignment) {
                    throw new AppError(
                        "Guest Assignment state changed before it could be updated.",
                        409
                    );
                }
            }
        );
    } finally {
        await session.endSession();
    }

    await auditLogService.createLog({
        user: userId,
        action: "UPDATE",
        module: "GUEST_ASSIGNMENT",
        referenceId: updatedAssignment._id,
        description:
            `Updated guest assignment for ${guestName}.`,
    });

    return updatedAssignment;
};


/**
 * Delete a Guest Assignment.
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

    const vehicleAssignmentId =
        assignment.vehicleAssignment?._id ||
        assignment.vehicleAssignment;

    const session =
        await mongoose.startSession();

    let deletedAssignment;

    try {
        await session.withTransaction(
            async () => {
                await lockVehicleAssignmentForGuestChanges(
                    vehicleAssignmentId,
                    userId,
                    session
                );

                deletedAssignment =
                    await guestAssignmentRepository.softDeleteIfPending(
                        id,
                        session
                    );

                if (!deletedAssignment) {
                    throw new AppError(
                        "Guest Assignment state changed before it could be deleted.",
                        409
                    );
                }
            }
        );
    } finally {
        await session.endSession();
    }

    await auditLogService.createLog({
        user: userId,
        action: "DELETE",
        module: "GUEST_ASSIGNMENT",
        referenceId: deletedAssignment._id,
        description:
            "Deleted pending guest assignment.",
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
