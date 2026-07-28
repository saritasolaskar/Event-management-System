const express = require("express");

const router = express.Router();

const controller =
require("../controllers/driverTracking.controller");

const protect =
require("../middleware/auth.middleware");

const authorize =
require("../middleware/authorize.middleware");

const validate =
require("../middleware/validate");

const {
    createTrackingValidator,
    dutyIdValidator,
} =
require("../validators/driverTracking.validator");

const { ROLES } =
require("../constants/roles");

/*
|--------------------------------------------------------------------------
| Driver sends GPS
|--------------------------------------------------------------------------
*/

router.post(
    "/",
    protect,
    authorize(
        ROLES.DRIVER
    ),
    createTrackingValidator,
    validate,
    controller.createTrackingPoint
);

/*
|--------------------------------------------------------------------------
| Admin / Client gets latest location
|--------------------------------------------------------------------------
*/

router.get(
    "/:dutyId/latest",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.CLIENT
    ),
    dutyIdValidator,
    validate,
    controller.getLatestLocation
);

/*
|--------------------------------------------------------------------------
| Admin gets route history
|--------------------------------------------------------------------------
*/

router.get(
    "/:dutyId/history",
    protect,
    authorize(
        ROLES.ADMIN
    ),
    dutyIdValidator,
    validate,
    controller.getTrackingHistory
);

module.exports = router;