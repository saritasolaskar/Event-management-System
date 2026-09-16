const express = require("express");

const router = express.Router();

const controller =
    require("../controllers/clientPortal.controller");

const protect =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/authorize.middleware");

const validate =
    require("../middleware/validate");

const { ROLES } =
    require("../constants/roles");

const AppError =
    require("../utils/AppError");

const {
    eventIdValidator,
    invoiceIdValidator,
} =
    require("../validators/clientPortal.validator");

/**
 * Guard ensuring client profile is linked to user account
 */
const ensureClientProfile = (
    req,
    res,
    next
) => {

    if (
        !req.user ||
        !req.user.client
    ) {
        return next(
            new AppError(
                "Access denied. No client profile is associated with this user account.",
                403
            )
        );
    }

    next();
};

/*
|--------------------------------------------------------------------------
| Client Portal Protection
|--------------------------------------------------------------------------
*/

router.use(
    protect,
    authorize(ROLES.CLIENT),
    ensureClientProfile
);

/*
|--------------------------------------------------------------------------
| Dashboard
|--------------------------------------------------------------------------
*/

router.get(
    "/dashboard",
    controller.getDashboard
);

/*
|--------------------------------------------------------------------------
| Events
|--------------------------------------------------------------------------
*/

router.get(
    "/events",
    controller.getEvents
);

/*
|--------------------------------------------------------------------------
| Event Overview
|--------------------------------------------------------------------------
*/

router.get(
    "/events/:id/overview",
    eventIdValidator,
    validate,
    controller.getEventOverview
);

/*
|--------------------------------------------------------------------------
| Event Guests
|--------------------------------------------------------------------------
*/

router.get(
    "/events/:id/guests",
    eventIdValidator,
    validate,
    controller.getGuests
);

/*
|--------------------------------------------------------------------------
| Event Vehicles
|--------------------------------------------------------------------------
*/

router.get(
    "/events/:id/vehicles",
    eventIdValidator,
    validate,
    controller.getVehicles
);

/*
|--------------------------------------------------------------------------
| Event Drivers
|--------------------------------------------------------------------------
*/

router.get(
    "/events/:id/drivers",
    eventIdValidator,
    validate,
    controller.getDrivers
);

/*
|--------------------------------------------------------------------------
| Event Live Tracking
|--------------------------------------------------------------------------
*/

router.get(
    "/events/:id/live",
    eventIdValidator,
    validate,
    controller.getLiveTracking
);

/*
|--------------------------------------------------------------------------
| Event Details
|--------------------------------------------------------------------------
| Keep generic /events/:id LAST.
|--------------------------------------------------------------------------
*/

router.get(
    "/events/:id",
    eventIdValidator,
    validate,
    controller.getEventDetails
);

/*
|--------------------------------------------------------------------------
| Invoices
|--------------------------------------------------------------------------
*/

router.get(
    "/invoices",
    controller.getInvoices
);

/*
|--------------------------------------------------------------------------
| Invoice Download
|--------------------------------------------------------------------------
*/

router.get(
    "/invoices/:id/download",
    invoiceIdValidator,
    validate,
    controller.downloadInvoice
);

/*
|--------------------------------------------------------------------------
| Invoice Details
|--------------------------------------------------------------------------
| Keep generic /invoices/:id LAST.
|--------------------------------------------------------------------------
*/

router.get(
    "/invoices/:id",
    invoiceIdValidator,
    validate,
    controller.getInvoice
);

module.exports = router;