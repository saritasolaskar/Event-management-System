const driverTrackingRepository =
    require("../repositories/driverTracking.repository");

const dutyRepository =
    require("../repositories/duty.repository");

const AppError =
    require("../utils/AppError");


/**
 * Create Tracking Point
 */
const createTrackingPoint = async (
    driverId,
    trackingData
) => {

    const duty =
        await dutyRepository.findActiveDutyByDriver(
            driverId
        );

    if (!duty) {
        throw new AppError(
            "No active duty assigned.",
            404
        );
    }

    return driverTrackingRepository.create({
        duty: duty._id,
        latitude: trackingData.latitude,
        longitude: trackingData.longitude,
        accuracy: trackingData.accuracy,
        speed: trackingData.speed,
        heading: trackingData.heading,
        stage: trackingData.stage,
    });
};


/**
 * Get Latest Location
 *
 * Client access is restricted to duties
 * belonging to that client.
 */
const getLatestLocation = async (
    dutyId,
    clientId
) => {

    const duty =
        await dutyRepository.findById(
            dutyId
        );

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    if (clientId) {

        const event =
            duty.vehicleAssignment?.event;

        const eventClientId =
            event?.client?._id ||
            event?.client;

        if (
            !eventClientId ||
            eventClientId.toString() !==
                clientId.toString()
        ) {
            throw new AppError(
                "Unauthorized.",
                403
            );
        }
    }

    const tracking =
        await driverTrackingRepository.findLatestByDuty(
            dutyId
        );

    if (!tracking) {
        throw new AppError(
            "Tracking data not found.",
            404
        );
    }

    return tracking;
};


/**
 * Get Tracking History
 */
const getTrackingHistory = async (
    dutyId
) => {

    return driverTrackingRepository.findHistoryByDuty(
        dutyId
    );
};


/**
 * Tracking history is intentionally preserved.
 *
 * It is useful for:
 * - Analytics
 * - Route history
 * - Driver performance
 * - Audit
 * - Reporting
 */


module.exports = {
    createTrackingPoint,
    getLatestLocation,
    getTrackingHistory,
};