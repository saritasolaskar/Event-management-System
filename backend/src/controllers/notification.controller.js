const notificationService =
require("../services/notification.service");

const asyncHandler =
require("../utils/asyncHandler");

const {
    successResponse,
} = require("../utils/response.utils");

/**
 * Get Logged-in User Notifications
 */
const getMyNotifications =
asyncHandler(async (req, res) => {

    const notifications =
    await notificationService.getMyNotifications(
        req.user._id
    );

    return successResponse(

        res,

        200,

        "Notifications fetched successfully.",

        notifications

    );

});

/**
 * Mark Notification As Read
 */
const markAsRead =
asyncHandler(async (req, res) => {

    const notification =
    await notificationService.markAsRead(

        req.params.id,

        req.user._id

    );

    return successResponse(

        res,

        200,

        "Notification marked as read.",

        notification

    );

});

/**
 * Mark All Notifications As Read
 */
const markAllAsRead =
asyncHandler(async (req, res) => {

    await notificationService.markAllAsRead(
        req.user._id
    );

    return successResponse(

        res,

        200,

        "All notifications marked as read."

    );

});

/**
 * Delete Notification
 */
const deleteNotification =
asyncHandler(async (req, res) => {

    const notification =
    await notificationService.deleteNotification(

        req.params.id,

        req.user._id

    );

    return successResponse(

        res,

        200,

        "Notification deleted successfully.",

        notification

    );

});

module.exports = {

    getMyNotifications,

    markAsRead,

    markAllAsRead,

    deleteNotification,

};