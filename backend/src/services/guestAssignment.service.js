
const mongoose =
    require("mongoose");

const guestAssignmentRepository =
    require("../repositories/guestAssignment.repository");

const vehicleAssignmentRepository =
    require("../repositories/vehicleAssignment.repository");

const guestRepository =
    require("../repositories/guest.repository");

const notificationService =
    require("./notification.service");

const auditLogService =
    require("./auditLog.service");

const {
    PICKUP_STATUS,
    RETURN_STATUS,
    VEHICLE_ASSIGNMENT_STATUS,
} = require("../constants/status");

const AppError =
    require("../utils/AppError");

/**
 * Get Guest Display Name
 */
const getGuestDisplayName =
    (guest) =>
        [
            guest?.firstName,
            guest?.lastName,
        ]
            .filter(Boolean)
            .join(" ")
            .trim() ||
        guest?.guestCode ||
        "Guest";

/**
 * Validate Vehicle Assignment
 */
const validateVehicleAssignment =
    async (
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
                VEHICLE_ASSIGNMENT_STATUS.ASSIGNED &&
            vehicleAssignment.status !==
                VEHICLE_ASSIGNMENT_STATUS.ON_DUTY
        ) {
            throw new AppError(
                "Guest can only be assigned to an active Vehicle Assignment.",
                400
            );
        }

        return vehicleAssignment;
    };

/**
 * Validate Guest belongs to Event
 */
const validateGuestForEvent =
    async (
        guestId,
        eventId
    ) => {
        const guest =
            await guestRepository.findById(
                guestId
            );

        if (!guest) {
            throw new AppError(
                "Guest not found.",
                404
            );
        }

        const guestEventId =
            guest.event?._id ||
            guest.event;

        if (
            !guestEventId ||
            guestEventId.toString() !==
                eventId.toString()
        ) {
            throw new AppError(
                "Guest and Vehicle Assignment must belong to the same event.",
                400
            );
        }

        return guest;
    };

/**
 * Create Guest Assignment
 */
const createGuestAssignment =
    async (
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

        const alreadyAssigned =
            await guestAssignmentRepository.findByGuest(
                data.guest
            );

        if (alreadyAssigned) {
            throw new AppError(
                "Guest is already assigned to a vehicle.",
                409
            );
        }

        const assignmentData = {
            ...data,
            createdBy: userId,
            updatedBy: userId,
        };

        let assignment;

        try {
            assignment =
                await guestAssignmentRepository.create(
                    assignmentData
                );
        } catch (error) {
            if (
                error.code === 11000
            ) {
                throw new AppError(
                    "Guest is already assigned to a vehicle.",
                    409
                );
            }

            throw error;
        }

        await notificationService.createNotification(
            {
                recipientUser:
                    userId,

                title:
                    "Guest Assigned",

                message:
                    `${guestName} assigned successfully.`,

                type:
                    "GUEST_ASSIGNED",

                referenceType:
                    "GUEST_ASSIGNMENT",

                referenceId:
                    assignment._id,
            }
        );

        await auditLogService.createLog(
            {
                user: userId,

                action:
                    "ASSIGN",

                module:
                    "GUEST_ASSIGNMENT",

                referenceId:
                    assignment._id,

                description:
                    `Assigned guest ${guestName} to vehicle.`,
            }
        );

        return assignment;
    };

/**
 * Bulk Assign Guests
 *
 * Entire operation is transactional.
 * If one guest fails, no guest assignment is created.
 */
const bulkAssignGuests =
    async (
        vehicleAssignmentId,
        guestIds,
        userId
    ) => {
        const vehicleAssignment =
            await validateVehicleAssignment(
                vehicleAssignmentId
            );

        if (
            !Array.isArray(guestIds) ||
            guestIds.length === 0
        ) {
            throw new AppError(
                "At least one guest is required.",
                400
            );
        }

        // Remove duplicate guest IDs from request.
        const uniqueGuestIds =
            [
                ...new Set(
                    guestIds.map(
                        (id) =>
                            id.toString()
                    )
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

        const session =
            await mongoose.startSession();

        const assignments = [];

        try {
            await session.withTransaction(
                async () => {
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
                            getGuestDisplayName(
                                guest
                            );

                        const alreadyAssigned =
                            await guestAssignmentRepository.findByGuest(
                                guestId
                            );

                        if (
                            alreadyAssigned
                        ) {
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
                                    },
                                    session
                                );
                        } catch (
                            error
                        ) {
                            if (
                                error.code ===
                                11000
                            ) {
                                throw new AppError(
                                    `Guest ${guestName} is already assigned.`,
                                    409
                                );
                            }

                            throw error;
                        }

                        assignments.push(
                            assignment
                        );
                    }
                }
            );
        } finally {
            await session.endSession();
        }

        // Audit only after successful transaction.
        for (
            const assignment
            of assignments
        ) {
            await auditLogService.createLog(
                {
                    user: userId,

                    action:
                        "ASSIGN",

                    module:
                        "GUEST_ASSIGNMENT",

                    referenceId:
                        assignment._id,

                    description:
                        "Guest assigned through bulk assignment.",
                }
            );
        }

        // Notify after successful transaction.
        await notificationService.createNotification(
            {
                recipientUser:
                    userId,

                title:
                    "Guests Assigned",

                message:
                    `${assignments.length} guest(s) assigned successfully.`,

                type:
                    "GUEST_ASSIGNED",

                referenceType:
                    "GUEST_ASSIGNMENT",

                referenceId:
                    vehicleAssignmentId,
            }
        );

        return assignments;
    };

/**
 * Get All Guest Assignments
 */
const getAllGuestAssignments =
    async () => {
        return guestAssignmentRepository.findAll();
    };

/**
 * Get Guest Assignment By ID
 */
const getGuestAssignmentById =
    async (id) => {
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
const updateGuestAssignment =
    async (
        id,
        data,
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

        if (
            assignment.pickupStatus !==
                PICKUP_STATUS.PENDING ||
            assignment.returnStatus !==
                RETURN_STATUS.NOT_STARTED
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

        const vehicleAssignment =
            await validateVehicleAssignment(
                targetVehicleAssignmentId
            );

        // IMPORTANT:
        // currentGuestId must always represent
        // the guest currently stored in the assignment.
        const currentGuestId =
            assignment.guest?._id ||
            assignment.guest;

        // targetGuestId represents the guest
        // that will exist after the update.
        const targetGuestId =
            data.guest ||
            currentGuestId;

        const guest =
            await validateGuestForEvent(
                targetGuestId,
                vehicleAssignment.event
            );

        const guestName =
            getGuestDisplayName(guest);

        /**
         * If changing the guest, make sure the
         * new guest is not already assigned elsewhere.
         */
        if (
            data.guest &&
            data.guest.toString() !==
                currentGuestId.toString()
        ) {
            const existingAssignment =
                await guestAssignmentRepository.findByGuest(
                    data.guest
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

        /**
         * If changing the vehicle assignment,
         * make sure the current guest is not
         * already assigned somewhere else.
         */
        if (
            data.vehicleAssignment &&
            data.vehicleAssignment.toString() !==
                currentVehicleAssignmentId.toString()
        ) {
            const existingAssignment =
                await guestAssignmentRepository.findByGuest(
                    targetGuestId
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

        const updateData = {
            updatedBy: userId,
        };

        if (
            data.vehicleAssignment
        ) {
            updateData.vehicleAssignment =
                data.vehicleAssignment;
        }

        if (data.guest) {
            updateData.guest =
                data.guest;
        }

        if (
            data.pickupSequence !==
            undefined
        ) {
            updateData.pickupSequence =
                data.pickupSequence;
        }

        if (
            data.dropSequence !==
            undefined
        ) {
            updateData.dropSequence =
                data.dropSequence;
        }

        if (
            data.remarks !==
            undefined
        ) {
            updateData.remarks =
                data.remarks;
        }

        const updatedAssignment =
            await guestAssignmentRepository.updateByIdIfPending(
                id,
                updateData
            );

        if (!updatedAssignment) {
            throw new AppError(
                "Guest Assignment state changed before it could be updated.",
                409
            );
        }

        await auditLogService.createLog(
            {
                user: userId,

                action:
                    "UPDATE",

                module:
                    "GUEST_ASSIGNMENT",

                referenceId:
                    updatedAssignment._id,

                description:
                    `Updated guest assignment for ${guestName}.`,
            }
        );

        return updatedAssignment;
    };

/**
 * Delete Guest Assignment
 */
const deleteGuestAssignment =
    async (
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

        if (
            assignment.pickupStatus !==
                PICKUP_STATUS.PENDING ||
            assignment.returnStatus !==
                RETURN_STATUS.NOT_STARTED
        ) {
            throw new AppError(
                "Guest Assignment cannot be deleted after the trip has started.",
                400
            );
        }

        const deletedAssignment =
            await guestAssignmentRepository.softDeleteIfPending(
                id
            );

        if (!deletedAssignment) {
            throw new AppError(
                "Guest Assignment state changed before it could be deleted.",
                409
            );
        }

        await auditLogService.createLog(
            {
                user: userId,

                action:
                    "DELETE",

                module:
                    "GUEST_ASSIGNMENT",

                referenceId:
                    assignment._id,

                description:
                    "Deleted guest assignment.",
            }
        );

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

