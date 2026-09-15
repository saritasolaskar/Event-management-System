const express = require("express");

const router = express.Router();

const controller = require("../controllers/clientPortal.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");
const AppError = require("../utils/AppError");

const {
    eventIdValidator,
    invoiceIdValidator,
} = require("../validators/clientPortal.validator");

/**
 * Guard ensuring client profile is linked to user account
 */
const ensureClientProfile = (req, res, next) => {
    if (!req.user || !req.user.client) {
        return next(
            new AppError(
                "Access denied. No client profile is associated with this user account.",
                403
            )
        );
    }
    next();
};

router.use(
    protect,
    authorize(ROLES.CLIENT),
    ensureClientProfile
);

router.get(
    "/dashboard",
    controller.getDashboard
);

router.get(
    "/events",
    controller.getEvents
);

router.get(
    "/events/:id",
    eventIdValidator,
    validate,
    controller.getEventDetails
);

router.get(
    "/events/:id/overview",
    eventIdValidator,
    validate,
    controller.getEventOverview
);

router.get(
    "/events/:id/guests",
    eventIdValidator,
    validate,
    controller.getGuests
);

router.get(
    "/events/:id/vehicles",
    eventIdValidator,
    validate,
    controller.getVehicles
);

router.get(
    "/events/:id/drivers",
    eventIdValidator,
    validate,
    controller.getDrivers
);

router.get(
    "/events/:id/live",
    eventIdValidator,
    validate,
    controller.getLiveTracking
);

router.get(
    "/invoices",
    controller.getInvoices
);

router.get(
    "/invoices/:id",
    invoiceIdValidator,
    validate,
    controller.getInvoice
);

router.get(
    "/invoices/:id/download",
    invoiceIdValidator,
    validate,
    controller.downloadInvoice
);

module.exports = router;