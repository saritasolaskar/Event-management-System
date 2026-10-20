
const mongoose = require("mongoose");

const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const guestAssignmentRepository = require("../repositories/guestAssignment.repository");
const dutyRepository = require("../repositories/duty.repository");
const AppError = require("../utils/AppError");

const {
    PICKUP_STATUS,
    RETURN_STATUS,
    VEHICLE_ASSIGNMENT_STATUS,
    DUTY_STATUS,
} = require("../constants/status");

/**
 * Resolve and authorize a guest assignment for the logged-in driver.
 */
const getDriverGuestAssignment = async (id, driverId) => {
    if (!driverId) {
        throw new AppError(
            "Driver profile is not linked to this account.",
            403
        );
    }

    const guestAssignment =
        await guestAssignmentRepository.findById(id);

    if (!guestAssignment) {
        throw new AppError("Guest assignment not found.", 404);
    }

    const vehicleAssignment =
        guestAssignment.vehicleAssignment;

    if (!vehicleAssignment) {
        throw new AppError(
            "Vehicle assignment not found.",
            404
        );
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
            "Guest operations can only be performed while duty is active.",
            400
        );
    }

    return guestAssignment;
};

/**
 * Driver dashboard.
 * Returns the current assignment and active duty, if one exists.
 */
const getDriverDashboard = async (driverId) => {
    if (!driverId) {
        throw new AppError(
            "Driver profile is not linked to this account.",
            403
        );
    }

    const assignment =
        await vehicleAssignmentRepository.findTodayByDriver(
            driverId
        );

    if (!assignment) {
        throw new AppError(
            "No active assignment found.",
            404
        );
    }

    const [guests, existingDuty] = await Promise.all([
        guestAssignmentRepository.findByVehicleAssignment(
            assignment._id
        ),
        dutyRepository.findByVehicleAssignment(
            assignment._id
        ),
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

/**
 * Return guest assignments for the driver's current assignment.
 */
const getAssignedGuests = async (driverId) => {
    if (!driverId) {
        throw new AppError(
            "Driver profile is not linked to this account.",
            403
        );
    }

    const assignment =
        await vehicleAssignmentRepository.findTodayByDriver(
            driverId
        );

    if (!assignment) {
        throw new AppError(
            "No active assignment found.",
            404
        );
    }

    return guestAssignmentRepository.findByVehicleAssignment(
        assignment._id
    );
};

/**
 * Perform a guest status transition safely.
 *
 * The parent assignment is written inside the same transaction
 * as the guest update. This coordinates guest actions with duty
 * completion, which also updates the parent assignment.
 */
const transitionGuestAssignment = async (
    id,
    driverId,
    expectedState,
    updateData
) => {
    const guestAssignment =
        await getDriverGuestAssignment(id, driverId);

    const vehicleAssignmentId =
        guestAssignment.vehicleAssignment._id ||
        guestAssignment.vehicleAssignment;

    const session = await mongoose.startSession();
    let updatedAssignment;

    try {
        await session.withTransaction(async () => {
            // Recheck and write the parent assignment inside
            // the transaction to coordinate concurrent changes.
            const activeParent =
                await vehicleAssignmentRepository.updateByIdAndStatus(
                    vehicleAssignmentId,
                    VEHICLE_ASSIGNMENT_STATUS.ON_DUTY,
                    {
                        updatedAt: new Date(),
                    },
                    session
                );

            if (!activeParent) {
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
                    "Guest status has changed or this action is no longer valid. Refresh and try again.",
                    409
                );
            }
        });
    } finally {
        await session.endSession();
    }

    return updatedAssignment;
};

/**
 * Mark driver en route to pick up the guest.
 */
const markDriverEnRoute = async (id, driverId) => {
    return transitionGuestAssignment(
        id,
        driverId,
        {
            pickupStatus: PICKUP_STATUS.PENDING,
            returnStatus: RETURN_STATUS.NOT_STARTED,
        },
        {
            pickupStatus: PICKUP_STATUS.DRIVER_EN_ROUTE,
        }
    );
};

/**
 * Mark the guest as picked up.
 */
const markGuestPicked = async (id, driverId) => {
    return transitionGuestAssignment(
        id,
        driverId,
        {
            pickupStatus: PICKUP_STATUS.DRIVER_EN_ROUTE,
        },
        {
            pickupStatus: PICKUP_STATUS.PICKED_UP,
            pickupTime: new Date(),
        }
    );
};

/**
 * Mark the guest as having arrived at the venue.
 */
const markVenueReached = async (id, driverId) => {
    return transitionGuestAssignment(
        id,
        driverId,
        {
            pickupStatus: PICKUP_STATUS.PICKED_UP,
        },
        {
            pickupStatus: PICKUP_STATUS.DROPPED_AT_VENUE,
            venueArrivalTime: new Date(),
        }
    );
};

/**
 * Start the guest's return pickup.
 */
const markReturnPickup = async (id, driverId) => {
    return transitionGuestAssignment(
        id,
        driverId,
        {
            pickupStatus: PICKUP_STATUS.DROPPED_AT_VENUE,
            returnStatus: RETURN_STATUS.NOT_STARTED,
        },
        {
            returnStatus: RETURN_STATUS.RETURN_PICKUP,
            returnPickupTime: new Date(),
        }
    );
};

/**
 * Mark the guest as dropped off at the end of the return trip.
 */
const markGuestDropped = async (id, driverId) => {
    return transitionGuestAssignment(
        id,
        driverId,
        {
            returnStatus: RETURN_STATUS.RETURN_PICKUP,
        },
        {
            returnStatus: RETURN_STATUS.DROPPED,
            dropTime: new Date(),
        }
    );
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
