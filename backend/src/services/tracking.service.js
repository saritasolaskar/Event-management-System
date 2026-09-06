const trackingRepository = require("../repositories/tracking.repository");
const dutyRepository = require("../repositories/duty.repository");
const User = require("../models/user.model");
const auditLogService = require("./auditLog.service");

const AppError = require("../utils/AppError");

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

    const driverUser = await User.findOne({
        driver: driverId,
        isDeleted: false,
    });

    if (driverUser) {
        await auditLogService.createLog({

            user: driverUser._id,

            action: "CREATE",

            module: "TRACKING",

            referenceId: tracking._id,

            description:
                "Live tracking started.",

        });
    }

} 

    return tracking;

};

/**
 * Get Latest Location Of A Duty
 */
const getDutyLiveLocation = async (
    dutyId,
    user
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

    if (user.role === "CLIENT") {
        const Event = require("../models/event.model");

        const duty = await dutyRepository.findById(dutyId);

        if (!duty || !duty.vehicleAssignment) {
            throw new AppError(
                "Duty not found.",
                404
            );
        }

        const event = await Event.findOne({
            _id: duty.vehicleAssignment.event,
            client: user.client,
            isDeleted: false,
        });

        if (!event) {
            throw new AppError(
                "You are not authorized to view this tracking data.",
                403
            );
        }
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