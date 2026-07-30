const driverApiService = require("../services/driverApi.service");

const asyncHandler = require("../utils/asyncHandler");

const { successResponse } = require("../utils/response.utils");

/**
 * Driver Dashboard
 */
const getDriverDashboard = asyncHandler(async (req, res) => {

    const dashboard =
        await driverApiService.getDriverDashboard(
            req.user.driver
        );

    return successResponse(
        res,
        200,
        "Dashboard fetched successfully.",
        dashboard
    );

});

/**
 * Today's Guest List
 */
const getAssignedGuests = asyncHandler(async (req, res) => {

    const guests =
        await driverApiService.getAssignedGuests(
            req.user.driver
        );

    return successResponse(
        res,
        200,
        "Guest list fetched successfully.",
        guests
    );

});

/**
 * Driver Started For Pickup
 */
const markDriverEnRoute = asyncHandler(async (req, res) => {

    const assignment =
        await driverApiService.markDriverEnRoute(
            req.params.id,
            req.user.driver
        );

    return successResponse(
        res,
        200,
        "Driver marked en route.",
        assignment
    );

});

/**
 * Guest Picked
 */
const markGuestPicked = asyncHandler(async (req, res) => {

    const assignment =
        await driverApiService.markGuestPicked(
            req.params.id,
            req.user.driver
        );

    return successResponse(
        res,
        200,
        "Guest picked successfully.",
        assignment
    );

});

/**
 * Guest Reached Venue
 */
const markVenueReached = asyncHandler(async (req, res) => {

    const assignment =
        await driverApiService.markVenueReached(
            req.params.id,
            req.user.driver
        );

    return successResponse(
        res,
        200,
        "Guest reached venue.",
        assignment
    );

});

/**
 * Return Pickup
 */
const markReturnPickup = asyncHandler(async (req, res) => {

    const assignment =
        await driverApiService.markReturnPickup(
            req.params.id,
            req.user.driver
        );

    return successResponse(
        res,
        200,
        "Return pickup started.",
        assignment
    );

});

/**
 * Final Drop
 */
const markGuestDropped = asyncHandler(async (req, res) => {

    const assignment =
        await driverApiService.markGuestDropped(
            req.params.id,
            req.user.driver
        );

    return successResponse(
        res,
        200,
        "Guest dropped successfully.",
        assignment
    );

});

module.exports = {
    getDriverDashboard,
    getAssignedGuests,
    markDriverEnRoute,
    markGuestPicked,
    markVenueReached,
    markReturnPickup,
    markGuestDropped,
};