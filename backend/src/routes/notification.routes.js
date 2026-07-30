const express = require("express");

const router = express.Router();

const controller =
require("../controllers/notification.controller");

const protect =
require("../middleware/auth.middleware");

const validate =
require("../middleware/validate");

const {
    notificationIdValidator,
} = require("../validators/notification.validator");

/*
|--------------------------------------------------------------------------
| All Notification Routes Require Authentication
|--------------------------------------------------------------------------
*/

router.use(protect);

/*
|--------------------------------------------------------------------------
| Get Logged-in User Notifications
|--------------------------------------------------------------------------
*/

router.get(

    "/",

    controller.getMyNotifications

);

/*
|--------------------------------------------------------------------------
| Mark Notification As Read
|--------------------------------------------------------------------------
*/

router.patch(

    "/:id/read",

    notificationIdValidator,

    validate,

    controller.markAsRead

);

/*
|--------------------------------------------------------------------------
| Mark All Notifications As Read
|--------------------------------------------------------------------------
*/

router.patch(

    "/read-all",

    controller.markAllAsRead

);

/*
|--------------------------------------------------------------------------
| Delete Notification
|--------------------------------------------------------------------------
*/

router.delete(

    "/:id",

    notificationIdValidator,

    validate,

    controller.deleteNotification

);

module.exports = router;