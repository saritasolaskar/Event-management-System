const driverTrackingRepository = require("../repositories/driverTracking.repository");
const dutyRepository = require("../repositories/duty.repository");

const AppError = require("../utils/appError");

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
 */
const getLatestLocation = async (dutyId) => {

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
const getTrackingHistory = async (dutyId) => {

    return driverTrackingRepository.findHistoryByDuty(
        dutyId
    );

};

/**
 * Delete Tracking History
 * Intentionally not implemented.
 *
 * Tracking history should be preserved for:
 * - Analytics
 * - Route history
 * - Driver performance
 * - Audit logs
 * - Reporting
 */

// const deleteTrackingHistory = async (dutyId) => {
//     return driverTrackingRepository.deleteByDuty(dutyId);
// };

module.exports = {
    createTrackingPoint,
    getLatestLocation,
    getTrackingHistory,
};