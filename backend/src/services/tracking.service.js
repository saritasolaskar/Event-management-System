
const trackingRepository =
    require("../repositories/tracking.repository");

const dutyRepository =
    require("../repositories/duty.repository");

const User =
    require("../models/user.model");

const Event =
    require("../models/event.model");

const auditLogService =
    require("./auditLog.service");

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

    const latest =
        await trackingRepository.findLatestByDuty(
            duty._id
        );

    const stage =
        location.stage ||
        latest?.stage ||
        TRIP_STAGE.NOT_STARTED;

    if (!Object.values(TRIP_STAGE).includes(stage)) {
        throw new AppError(
            "Invalid tracking stage.",
            400
        );
    }

    if (latest?.stage) {

        const previousIndex =
            getStageIndex(latest.stage);

        const currentIndex =
            getStageIndex(stage);

        if (
            previousIndex === -1 ||
            currentIndex === -1 ||
            currentIndex < previousIndex
        ) {
            throw new AppError(
                "Invalid tracking stage progression.",
                400
            );
        }
    }

    const tracking =
        await trackingRepository.create({

            duty: duty._id,

            driver: driverId,

            vehicleAssignment:
                duty.vehicleAssignment._id,

            latitude:
                Number(location.latitude),

            longitude:
                Number(location.longitude),

            accuracy:
                location.accuracy ?? 0,

            speed:
                location.speed ?? 0,

            heading:
                location.heading ?? 0,

            stage,

            recordedAt:
                new Date(),
        });

    if (!latest) {

        const driverUser =
            await User.findOne({
                driver: driverId,
                isDeleted: false,
            });

        if (driverUser) {

            await auditLogService.createLog({

                user:
                    driverUser._id,

                action:
                    "CREATE",

                module:
                    "TRACKING",

                referenceId:
                    tracking._id,

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

    const duty =
        await dutyRepository.findById(
            dutyId
        );

    if (
        !duty ||
        !duty.vehicleAssignment
    ) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

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

        if (!user.client) {
            throw new AppError(
                "Client profile is not linked to this account.",
                403
            );
        }

        const event =
            await Event.findOne({
                _id:
                    duty.vehicleAssignment.event,

                client:
                    user.client,

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

    return trackingRepository
        .findLatestActiveLocations();
};

/**
 * Get Complete Tracking History
 */
const getTrackingHistory = async (
    dutyId
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

    return trackingRepository
        .findHistoryByDuty(
            dutyId
        );
};

module.exports = {
    updateLocation,
    getDutyLiveLocation,
    getAllLiveLocations,
    getTrackingHistory,
};