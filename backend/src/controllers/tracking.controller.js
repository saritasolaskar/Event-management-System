const trackingService =
require("../services/tracking.service");

const asyncHandler =
require("../utils/asyncHandler");

const {
    successResponse,
} = require("../utils/response.utils");

/**
 * Driver Updates Live Location
 */
const updateLocation =
asyncHandler(async (req, res) => {

    const tracking =
    await trackingService.updateLocation(

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
 * Get Live Location Of A Duty
 */
const getDutyLiveLocation =
asyncHandler(async (req, res) => {

    const tracking =
    await trackingService.getDutyLiveLocation(

        req.params.dutyId

    );

    return successResponse(

        res,

        200,

        "Live location fetched successfully.",

        tracking

    );

});

/**
 * Get Live Locations Of All Active Duties
 */
const getAllLiveLocations =
asyncHandler(async (req, res) => {

    const tracking =
    await trackingService.getAllLiveLocations();

    return successResponse(

        res,

        200,

        "Live locations fetched successfully.",

        tracking

    );

});

/**
 * Get Tracking History
 */
const getTrackingHistory =
asyncHandler(async (req, res) => {

    const history =
    await trackingService.getTrackingHistory(

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

    updateLocation,

    getDutyLiveLocation,

    getAllLiveLocations,

    getTrackingHistory,

};