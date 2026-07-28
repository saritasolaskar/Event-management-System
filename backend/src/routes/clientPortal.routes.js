const express = require("express");

const router = express.Router();

const controller =
require("../controllers/clientPortal.controller");

const protect =
require("../middleware/auth.middleware");

const authorize =
require("../middleware/authorize.middleware");

const { ROLES } =
require("../constants/roles");

router.use(
    protect,
    authorize(ROLES.CLIENT)
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
    controller.getEventDetails
);

router.get(
    "/events/:id/guests",
    controller.getGuests
);

router.get(
    "/events/:id/vehicles",
    controller.getVehicles
);

router.get(
    "/invoices",
    controller.getInvoices
);

router.get(
    "/events/:id/overview",
    controller.getEventOverview
);

router.get(

    "/events/:id/drivers",

    controller.getDrivers

);

router.get(

    "/events/:id/live",

    controller.getLiveTracking

);

router.get(

    "/invoices/:id",

    controller.getInvoice

);

router.get(

    "/invoices/:id/download",

    controller.downloadInvoice

);

router.get(
    "/events/:id/drivers",
    controller.getDrivers
);

router.get(
    "/events/:id/live",
    controller.getLiveTracking
);


router.get(
    "/invoices/:id",
    controller.getInvoice
);

module.exports = router;