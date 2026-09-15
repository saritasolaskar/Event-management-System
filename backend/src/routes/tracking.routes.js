const express = require("express");

const router = express.Router();

const controller =
require("../controllers/tracking.controller");

const protect =
require("../middleware/auth.middleware");

const authorize =
require("../middleware/authorize.middleware");

const validate =
require("../middleware/validate");

const {
    updateLocationValidator,
    dutyIdValidator,
} = require("../validators/tracking.validator");

const { ROLES } =
require("../constants/roles");

/*
|--------------------------------------------------------------------------
| Driver App
|--------------------------------------------------------------------------
| Driver sends live GPS updates.
*/

router.post(

    "/location",

    protect,

    authorize(
        ROLES.DRIVER
    ),

    updateLocationValidator,

    validate,

    controller.updateLocation

);

/*
|--------------------------------------------------------------------------
| Admin Dashboard
|--------------------------------------------------------------------------
| View all active vehicles live.
*/

router.get(

    "/live",

    protect,

    authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER,
    ROLES.ACCOUNTS
),

    controller.getAllLiveLocations

);

/*
|--------------------------------------------------------------------------
| Live Location Of One Duty
|--------------------------------------------------------------------------
*/

router.get(

    "/:dutyId",

    protect,

    authorize(

        ROLES.ADMIN,

        ROLES.ACCOUNTS,

        ROLES.CLIENT

    ),

    dutyIdValidator,

    validate,

    controller.getDutyLiveLocation

);

/*
|--------------------------------------------------------------------------
| Complete Tracking History
|--------------------------------------------------------------------------
*/

router.get(

    "/:dutyId/history",

    protect,

    authorize(

        ROLES.ADMIN,

        ROLES.ACCOUNTS

    ),

    dutyIdValidator,

    validate,

    controller.getTrackingHistory

);

module.exports = router;