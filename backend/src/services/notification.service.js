const notificationRepository =
require("../repositories/notification.repository");

const AppError =
require("../utils/AppError");

/**
 * Create Notification
 */
const createNotification = async ({

    recipientUser,

    title,

    message,

    type,

    referenceType = "SYSTEM",

    referenceId = null,

}) => {

    return notificationRepository.create({

        recipientUser,

        title,

        message,

        type,

        referenceType,

        referenceId,

    });

};

/**
 * Get Logged-in User Notifications
 */
const getMyNotifications = async (
    userId
) => {

    return notificationRepository.findByRecipient(
        userId
    );

};

/**
 * Mark Notification As Read
 */
const markAsRead = async (
    notificationId,
    userId
) => {

    const notification =
        await notificationRepository.findById(
            notificationId
        );

    if (!notification) {
        throw new AppError(
            "Notification not found.",
            404
        );
    }

    if (
        notification.recipientUser.toString() !==
        userId.toString()
    ) {
        throw new AppError(
            "Unauthorized.",
            403
        );
    }

    return notificationRepository.markAsRead(
        notificationId
    );

};

/**
 * Mark All Notifications As Read
 */
const markAllAsRead = async (
    userId
) => {

    return notificationRepository.markAllAsRead(
        userId
    );

};

/**
 * Delete Notification
 */
const deleteNotification = async (
    notificationId,
    userId
) => {

    const notification =
        await notificationRepository.findById(
            notificationId
        );

    if (!notification) {
        throw new AppError(
            "Notification not found.",
            404
        );
    }

    if (
        notification.recipientUser.toString() !==
        userId.toString()
    ) {
        throw new AppError(
            "Unauthorized.",
            403
        );
    }

    return notificationRepository.softDelete(
        notificationId
    );

};

module.exports = {

    createNotification,

    getMyNotifications,

    markAsRead,

    markAllAsRead,

    deleteNotification,

};