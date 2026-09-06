const clientPortalService = require("../services/clientPortal.service");

const asyncHandler = require("../utils/asyncHandler");

const {
    successResponse,
} = require("../utils/response.utils");

const getDashboard = asyncHandler(async (req, res) => {

    const dashboard =
        await clientPortalService.getDashboard(
            req.user.client
        );

    return successResponse(
        res,
        200,
        "Dashboard fetched successfully.",
        dashboard
    );

});

const getEvents = asyncHandler(async (req, res) => {

    const events =
        await clientPortalService.getEvents(
            req.user.client
        );

    return successResponse(
        res,
        200,
        "Events fetched successfully.",
        events
    );

});

const getEventDetails = asyncHandler(async (req, res) => {

    const event =
        await clientPortalService.getEventDetails(
            req.params.id,
            req.user.client
        );

    return successResponse(
        res,
        200,
        "Event details fetched successfully.",
        event
    );

});

const getGuests = asyncHandler(async (req, res) => {

    const guests =
        await clientPortalService.getGuests(
    req.params.id,
    req.user.client
);

    return successResponse(
        res,
        200,
        "Guests fetched successfully.",
        guests
    );

});

const getVehicles = asyncHandler(async (req, res) => {

    const vehicles =
        await clientPortalService.getVehicles(
    req.params.id,
    req.user.client
);

    return successResponse(
        res,
        200,
        "Vehicle assignments fetched successfully.",
        vehicles
    );

});

const getInvoices = asyncHandler(async (req, res) => {

    const invoices =
        await clientPortalService.getInvoices(
            req.user.client
        );

    return successResponse(
        res,
        200,
        "Invoices fetched successfully.",
        invoices
    );

});

const getEventOverview =
asyncHandler(async(req,res)=>{

    const data =
    await clientPortalService.getEventOverview(

        req.params.id,

        req.user.client

    );

    return successResponse(
        res,
        200,
        "Overview fetched successfully.",
        data
    );

});


const getLiveTracking =
asyncHandler(async(req,res)=>{

    const tracking =
        await clientPortalService
            .getLiveTracking(
    req.params.id,
    req.user.client
);

    return successResponse(

        res,

        200,

        "Live tracking fetched successfully.",

        tracking

    );

});

const getInvoice =
asyncHandler(async(req,res)=>{

    const invoice =
        await clientPortalService
            .getInvoice(

                req.params.id,

                req.user.client

            );

    return successResponse(

        res,

        200,

        "Invoice fetched successfully.",

        invoice

    );

});


const getDrivers =
asyncHandler(async(req,res)=>{

    const drivers =
        await clientPortalService.getDrivers(
    req.params.id,
    req.user.client
);

    return successResponse(

        res,

        200,

        "Drivers fetched successfully.",

        drivers

    );

});



module.exports = {
    getDashboard,
    getEvents,
    getEventDetails,
    getGuests,
    getVehicles,
    getInvoices,
    getEventOverview,
    getDrivers,
    getLiveTracking,
    getInvoice,
};