const driverTrackingRepository =
    require("../repositories/driverTracking.repository");

const dutyRepository =
    require("../repositories/duty.repository");

const AppError =
    require("../utils/AppError");

const {
    TRIP_STAGE,
} = require("../constants/status");

const STAGE_ORDER = [
    TRIP_STAGE.NOT_STARTED,
    TRIP_STAGE.PICKUP_STARTED,
    TRIP_STAGE.PICKUP_COMPLETED,
    TRIP_STAGE.EVENT_DUTY,
    TRIP_STAGE.RETURN_STARTED,
    TRIP_STAGE.RETURN_COMPLETED,
    TRIP_STAGE.COMPLETED,
];

const getStageIndex = (stage) =>
    STAGE_ORDER.indexOf(stage);

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

    const latest =
        await driverTrackingRepository.findLatestByDuty(
            duty._id
        );

    if (latest) {

        const previousIndex =
            getStageIndex(latest.stage);

        const nextIndex =
            getStageIndex(trackingData.stage);

        if (
            previousIndex === -1 ||
            nextIndex === -1 ||
            nextIndex < previousIndex
        ) {
            throw new AppError(
                "Invalid tracking stage progression.",
                400
            );
        }
    }

    return driverTrackingRepository.create({

        duty: duty._id,

        latitude:
            trackingData.latitude,

        longitude:
            trackingData.longitude,

        accuracy:
            trackingData.accuracy ?? 0,

        speed:
            trackingData.speed ?? 0,

        heading:
            trackingData.heading ?? 0,

        stage:
            trackingData.stage,
    });
};


/**
 * Get Latest Location
 *
 * CLIENT users can only see
 * tracking belonging to their own event.
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


module.exports = {
    createTrackingPoint,
    getLatestLocation,
    getTrackingHistory,
};