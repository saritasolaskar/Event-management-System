
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const guestAssignmentRepository = require("../repositories/guestAssignment.repository");
const dutyRepository = require("../repositories/duty.repository");
const AppError = require("../utils/AppError");
const mongoose = require("mongoose");
const {
    PICKUP_STATUS,
    RETURN_STATUS,
    VEHICLE_ASSIGNMENT_STATUS,
    DUTY_STATUS,
} = require("../constants/status");

const getDriverGuestAssignment = async (id, driverId) => {
    const guestAssignment =
        await guestAssignmentRepository.findById(id);

    if (!guestAssignment) {
        throw new AppError("Guest assignment not found.", 404);
    }

    const vehicleAssignment = guestAssignment.vehicleAssignment;

    if (!vehicleAssignment) {
        throw new AppError("Vehicle assignment not found.", 404);
    }

    const assignedDriver =
        vehicleAssignment.driver?._id ||
        vehicleAssignment.driver;

    if (
        !assignedDriver ||
        assignedDriver.toString() !== driverId.toString()
    ) {
        throw new AppError(
            "You are not authorized to update this guest assignment.",
            403
        );
    }

    if (
        vehicleAssignment.status !==
        VEHICLE_ASSIGNMENT_STATUS.ON_DUTY
    ) {
        throw new AppError(
            "Guest operations can only be performed after duty has started.",
            400
        );
    }

    return guestAssignment;
};

/**
 * Driver dashboard.
 * Returns the assignment, its active duty (if started), and guest count.
 */
const getDriverDashboard = async (driverId) => {
    if (!driverId) {
        throw new AppError(
            "Driver profile is not linked to this account.",
            403
        );
    }

    const assignment =
        await vehicleAssignmentRepository.findTodayByDriver(driverId);

    if (!assignment) {
        throw new AppError("No active assignment found.", 404);
    }

    const [guests, existingDuty] = await Promise.all([
        guestAssignmentRepository.findByVehicleAssignment(
            assignment._id
        ),
        dutyRepository.findByVehicleAssignment(assignment._id),
    ]);

    const duty =
        existingDuty?.status === DUTY_STATUS.STARTED
            ? existingDuty
            : null;

    return {
        assignment,
        duty,
        totalGuests: guests.length,
        guests,
    };
};

const getAssignedGuests = async (driverId) => {
    if (!driverId) {
        throw new AppError(
            "Driver profile is not linked to this account.",
            403
        );
    }

    const assignment =
        await vehicleAssignmentRepository.findTodayByDriver(driverId);

    if (!assignment) {
        throw new AppError("No active assignment found.", 404);
    }

    return guestAssignmentRepository.findByVehicleAssignment(
        assignment._id
    );
};

const markDriverEnRoute = async (id, driverId) => {
    const assignment =
        await getDriverGuestAssignment(id, driverId);

    if (assignment.pickupStatus !== PICKUP_STATUS.PENDING) {
        throw new AppError(
            "Guest must be in PENDING status before starting pickup.",
            400
        );
    }

    const updatedAssignment =
        await guestAssignmentRepository.updateByIdIfState(
            id,
            {
                pickupStatus: PICKUP_STATUS.PENDING,
                returnStatus: RETURN_STATUS.NOT_STARTED,
            },
            {
                pickupStatus: PICKUP_STATUS.DRIVER_EN_ROUTE,
            }
        );

    if (!updatedAssignment) {
        throw new AppError(
            "Guest assignment was already updated by another request.",
            409
        );
    }

    return updatedAssignment;
};

const markGuestPicked = async (id, driverId) => {
    const assignment =
        await getDriverGuestAssignment(id, driverId);

    if (
        assignment.pickupStatus !==
        PICKUP_STATUS.DRIVER_EN_ROUTE
    ) {
        throw new AppError(
            "Driver must be en route before marking guest as picked up.",
            400
        );
    }

    const updatedAssignment =
        await guestAssignmentRepository.updateByIdIfState(
            id,
            { pickupStatus: PICKUP_STATUS.DRIVER_EN_ROUTE },
            {
                pickupStatus: PICKUP_STATUS.PICKED_UP,
                pickupTime: new Date(),
            }
        );

    if (!updatedAssignment) {
        throw new AppError(
            "Guest assignment was already updated by another request.",
            409
        );
    }

    return updatedAssignment;
};

const markVenueReached = async (id, driverId) => {
    const assignment =
        await getDriverGuestAssignment(id, driverId);

    if (
        assignment.pickupStatus !== PICKUP_STATUS.PICKED_UP
    ) {
        throw new AppError(
            "Guest must be picked up before reaching the venue.",
            400
        );
    }

    const updatedAssignment =
        await guestAssignmentRepository.updateByIdIfState(
            id,
            { pickupStatus: PICKUP_STATUS.PICKED_UP },
            {
                pickupStatus: PICKUP_STATUS.DROPPED_AT_VENUE,
                venueArrivalTime: new Date(),
            }
        );

    if (!updatedAssignment) {
        throw new AppError(
            "Guest assignment was already updated by another request.",
            409
        );
    }

    return updatedAssignment;
};

const markReturnPickup = async (id, driverId) => {
    const assignment =
        await getDriverGuestAssignment(id, driverId);

    if (
        assignment.pickupStatus !==
        PICKUP_STATUS.DROPPED_AT_VENUE
    ) {
        throw new AppError(
            "Guest must reach the venue before return pickup.",
            400
        );
    }

    if (
        assignment.returnStatus !== RETURN_STATUS.NOT_STARTED
    ) {
        throw new AppError(
            "Return pickup has already started or completed.",
            400
        );
    }

    const updatedAssignment =
        await guestAssignmentRepository.updateByIdIfState(
            id,
            {
                pickupStatus: PICKUP_STATUS.DROPPED_AT_VENUE,
                returnStatus: RETURN_STATUS.NOT_STARTED,
            },
            {
                returnStatus: RETURN_STATUS.RETURN_PICKUP,
                returnPickupTime: new Date(),
            }
        );

    if (!updatedAssignment) {
        throw new AppError(
            "Guest assignment was already updated by another request.",
            409
        );
    }

    return updatedAssignment;
};

const markGuestDropped = async (id, driverId) => {
    const assignment =
        await getDriverGuestAssignment(id, driverId);

    if (
        assignment.returnStatus !== RETURN_STATUS.RETURN_PICKUP
    ) {
        throw new AppError(
            "Guest must be picked up for return before marking as dropped.",
            400
        );
    }

    const updatedAssignment =
        await guestAssignmentRepository.updateByIdIfState(
            id,
            { returnStatus: RETURN_STATUS.RETURN_PICKUP },
            {
                returnStatus: RETURN_STATUS.DROPPED,
                dropTime: new Date(),
            }
        );

    if (!updatedAssignment) {
        throw new AppError(
            "Guest assignment was already updated by another request.",
            409
        );
    }

    return updatedAssignment;
};



const transitionGuestAssignment = async (
    id,
    driverId,
    expectedState,
    updateData
) => {
    // Verify ownership and that duty is active.
    const assignment = await getDriverGuestAssignment(
        id,
        driverId
    );

    const vehicleAssignmentId =
        assignment.vehicleAssignment._id ||
        assignment.vehicleAssignment;

    const session = await mongoose.startSession();
    let updatedAssignment;

    try {
        await session.withTransaction(async () => {
            // Write to the parent assignment so duty completion
            // and guest transitions cannot silently race each other.
            const lockedParent =
                await vehicleAssignmentRepository.updateByIdAndStatus(
                    vehicleAssignmentId,
                    VEHICLE_ASSIGNMENT_STATUS.ON_DUTY,
                    { updatedAt: new Date() },
                    session
                );

            if (!lockedParent) {
                throw new AppError(
                    "Duty is no longer active. Refresh and try again.",
                    409
                );
            }

            updatedAssignment =
                await guestAssignmentRepository.updateByIdIfState(
                    id,
                    {
                        ...expectedState,
                        vehicleAssignment: vehicleAssignmentId,
                    },
                    updateData,
                    session
                );

            if (!updatedAssignment) {
                throw new AppError(
                    "Guest status changed or the action is no longer valid. Refresh and try again.",
                    409
                );
            }
        });
    } finally {
        await session.endSession();
    }

    return updatedAssignment;
};


module.exports = {
    getDriverDashboard,
    getAssignedGuests,
    markDriverEnRoute,
    markGuestPicked,
    markVenueReached,
    markReturnPickup,
    markGuestDropped,
};
