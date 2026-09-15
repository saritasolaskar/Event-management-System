
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const guestAssignmentRepository = require("../repositories/guestAssignment.repository");

const AppError = require("../utils/AppError");

const {
    PICKUP_STATUS,
    RETURN_STATUS,
} = require("../constants/status");

/**
 * Verify that a guest assignment belongs to the logged-in driver.
 */
const getDriverGuestAssignment = async (id, driverId) => {
    const guestAssignment =
        await guestAssignmentRepository.findById(id);

    if (!guestAssignment) {
        throw new AppError(
            "Guest assignment not found.",
            404
        );
    }

    const assignedDriver =
        guestAssignment.vehicleAssignment?.driver?._id ||
        guestAssignment.vehicleAssignment?.driver;

    if (
        !assignedDriver ||
        assignedDriver.toString() !== driverId.toString()
    ) {
        throw new AppError(
            "You are not authorized to update this guest assignment.",
            403
        );
    }

    return guestAssignment;
};

/**
 * Driver Dashboard
 */
const getDriverDashboard = async (driverId) => {
    const assignment =
        await vehicleAssignmentRepository.findTodayByDriver(driverId);

    if (!assignment) {
        throw new AppError(
            "No active assignment found.",
            404
        );
    }

    const guests =
        await guestAssignmentRepository.findByVehicleAssignment(
            assignment._id
        );

    return {
        assignment,
        totalGuests: guests.length,
        guests,
    };
};

/**
 * Assigned Guests
 */
const getAssignedGuests = async (driverId) => {
    const assignment =
        await vehicleAssignmentRepository.findTodayByDriver(driverId);

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
 * Driver En Route
 */
const markDriverEnRoute = async (
    id,
    driverId
) => {
    const assignment =
        await getDriverGuestAssignment(
            id,
            driverId
        );

    if (
        assignment.pickupStatus !==
        PICKUP_STATUS.PENDING
    ) {
        throw new AppError(
            "Guest must be in PENDING status before starting pickup.",
            400
        );
    }

    const updatedAssignment =
        await guestAssignmentRepository.updateByIdIfState(
            id,
            {
                pickupStatus:
                    PICKUP_STATUS.PENDING,
                returnStatus:
                    RETURN_STATUS.NOT_STARTED,
            },
            {
                pickupStatus:
                    PICKUP_STATUS.DRIVER_EN_ROUTE,
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

/**
 * Guest Picked
 */
const markGuestPicked = async (
    id,
    driverId
) => {
    const assignment =
        await getDriverGuestAssignment(
            id,
            driverId
        );

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
            {
                pickupStatus:
                    PICKUP_STATUS.DRIVER_EN_ROUTE,
            },
            {
                pickupStatus:
                    PICKUP_STATUS.PICKED_UP,
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

/**
 * Venue Reached
 */
const markVenueReached = async (
    id,
    driverId
) => {
    const assignment =
        await getDriverGuestAssignment(
            id,
            driverId
        );

    if (
        assignment.pickupStatus !==
        PICKUP_STATUS.PICKED_UP
    ) {
        throw new AppError(
            "Guest must be picked up before reaching the venue.",
            400
        );
    }

    const updatedAssignment =
        await guestAssignmentRepository.updateByIdIfState(
            id,
            {
                pickupStatus:
                    PICKUP_STATUS.PICKED_UP,
            },
            {
                pickupStatus:
                    PICKUP_STATUS.DROPPED_AT_VENUE,
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

/**
 * Return Pickup
 */
const markReturnPickup = async (
    id,
    driverId
) => {
    const assignment =
        await getDriverGuestAssignment(
            id,
            driverId
        );

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
        assignment.returnStatus !==
        RETURN_STATUS.NOT_STARTED
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
                pickupStatus:
                    PICKUP_STATUS.DROPPED_AT_VENUE,
                returnStatus:
                    RETURN_STATUS.NOT_STARTED,
            },
            {
                returnStatus:
                    RETURN_STATUS.RETURN_PICKUP,
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

/**
 * Guest Dropped
 */
const markGuestDropped = async (
    id,
    driverId
) => {
    const assignment =
        await getDriverGuestAssignment(
            id,
            driverId
        );

    if (
        assignment.returnStatus !==
        RETURN_STATUS.RETURN_PICKUP
    ) {
        throw new AppError(
            "Guest must be picked up for return before marking as dropped.",
            400
        );
    }

    const updatedAssignment =
        await guestAssignmentRepository.updateByIdIfState(
            id,
            {
                returnStatus:
                    RETURN_STATUS.RETURN_PICKUP,
            },
            {
                returnStatus:
                    RETURN_STATUS.DROPPED,
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
module.exports = {
    getDriverDashboard,
    getAssignedGuests,
    markDriverEnRoute,
    markGuestPicked,
    markVenueReached,
    markReturnPickup,
    markGuestDropped,
};
