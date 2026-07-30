const trackingRepository = require("../repositories/tracking.repository");
const dutyRepository = require("../repositories/duty.repository");

const auditLogService = require("./auditLog.service");

const AppError = require("../utils/appError");

/**
 * Driver Updates Live Location
 */
const updateLocation = async (
    driverId,
    location
) => {

    const duty =
        await dutyRepository.findActiveDutyByDriver(
            driverId
        );

    if (!duty) {
        throw new AppError(
            "No active duty found.",
            404
        );
    }

    if (
        location.latitude === undefined ||
        location.longitude === undefined
    ) {
        throw new AppError(
            "Latitude and Longitude are required.",
            400
        );
    }

    const tracking =
        await trackingRepository.create({

            duty: duty._id,

            driver: driverId,

            vehicleAssignment:
                duty.vehicleAssignment._id,

            latitude: location.latitude,

            longitude: location.longitude,

            accuracy: location.accuracy,

            speed: location.speed,

            heading: location.heading,

            stage: location.stage,

        });

    // Log only the first tracking record
    const history =
        await trackingRepository.findHistoryByDuty(
            duty._id
        );

    if (history.length === 1) {

        await auditLogService.createLog({

            user: driverId,

            action: "CREATE",

            module: "TRACKING",

            referenceId: tracking._id,

            description:
                "Live tracking started.",

        });

    }

    return tracking;

};

/**
 * Get Latest Location Of A Duty
 */
const getDutyLiveLocation = async (
    dutyId
) => {

    const tracking =
        await trackingRepository.findLatestByDuty(
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
 * Get All Active Live Locations
 */
const getAllLiveLocations = async () => {

    return trackingRepository.findLatestActiveLocations();

};

/**
 * Get Complete Tracking History
 */
const getTrackingHistory = async (
    dutyId
) => {

    return trackingRepository.findHistoryByDuty(
        dutyId
    );

};

module.exports = {

    updateLocation,

    getDutyLiveLocation,

    getAllLiveLocations,

    getTrackingHistory,

};