const { PICKUP_STATUS, RETURN_STATUS } = require("../constants/status");

/**
 * Guest List
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

    return await guestAssignmentRepository.findByVehicleAssignment(
        assignment._id
    );
};

/**
 * Driver En Route
 */
const markDriverEnRoute = async (id) => {

    return guestAssignmentRepository.updateById(id, {
        pickupStatus: PICKUP_STATUS.DRIVER_EN_ROUTE,
    });
};

/**
 * Guest Picked
 */
const markGuestPicked = async (id) => {

    return guestAssignmentRepository.updateById(id, {
        pickupStatus: PICKUP_STATUS.PICKED_UP,
        pickupTime: new Date(),
    });
};

/**
 * Venue Reached
 */
const markVenueReached = async (id) => {

    return guestAssignmentRepository.updateById(id, {
        pickupStatus: PICKUP_STATUS.DROPPED_AT_VENUE,
        venueArrivalTime: new Date(),
    });
};

/**
 * Return Pickup
 */
const markReturnPickup = async (id) => {

    return guestAssignmentRepository.updateById(id, {
        returnStatus: RETURN_STATUS.RETURN_PICKUP,
        returnPickupTime: new Date(),
    });
};

/**
 * Guest Dropped
 */
const markGuestDropped = async (id) => {

    return guestAssignmentRepository.updateById(id, {
        returnStatus: RETURN_STATUS.DROPPED,
        dropTime: new Date(),
    });
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