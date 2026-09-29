const driverTrackingService =
    require("../services/driverTracking.service");

const asyncHandler =
    require("../utils/asyncHandler");

const AppError =
    require("../utils/AppError");

const {
    successResponse,
} = require("../utils/response.utils");


/**
 * Driver sends GPS location
 */
const createTrackingPoint =
    asyncHandler(async (req, res) => {

        if (!req.user.driver) {
            throw new AppError(
                "Driver profile is not linked to this account.",
                403
            );
        }

        const tracking =
            await driverTrackingService.createTrackingPoint(
                req.user.driver,
                req.body
            );

        return successResponse(
            res,
            201,
            "Location updated successfully.",
            tracking
        );
    });


/**
 * Get latest location
 */
const getLatestLocation =
    asyncHandler(async (req, res) => {

        let clientId;

        if (req.user.role === "CLIENT") {
            if (!req.user.client) {
                throw new AppError(
                    "Client profile is not linked to this account.",
                    403
                );
            }

            clientId = req.user.client;
        }

        const tracking =
            await driverTrackingService.getLatestLocation(
                req.params.dutyId,
                clientId
            );

        return successResponse(
            res,
            200,
            "Latest location fetched successfully.",
            tracking
        );
    });


/**
 * Get tracking history
 */
const getTrackingHistory =
    asyncHandler(async (req, res) => {

        const history =
            await driverTrackingService.getTrackingHistory(
                req.params.dutyId
            );

        return successResponse(
            res,
            200,
            "Tracking history fetched successfully.",
            history
        );
    });


module.exports = {
    createTrackingPoint,
    getLatestLocation,
    getTrackingHistory,
};