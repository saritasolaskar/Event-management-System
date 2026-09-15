const notificationRepository =
    require("../repositories/notification.repository");

const AppError =
    require("../utils/AppError");

const {
    NOTIFICATION_TYPE,
} = require("../constants/status");


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

    if (!recipientUser) {
        throw new AppError(
            "Notification recipient is required.",
            400
        );
    }

    if (!Object.values(
        NOTIFICATION_TYPE
    ).includes(type)) {
        throw new AppError(
            "Invalid notification type.",
            400
        );
    }

    if (!title?.trim()) {
        throw new AppError(
            "Notification title is required.",
            400
        );
    }

    if (!message?.trim()) {
        throw new AppError(
            "Notification message is required.",
            400
        );
    }

    return notificationRepository.create({
        recipientUser,
        title: title.trim(),
        message: message.trim(),
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
 * Get Unread Notification Count
 */
const getUnreadCount = async (
    userId
) => {

    return notificationRepository.countUnread(
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
        await notificationRepository.markAsRead(
            notificationId,
            userId
        );

    if (!notification) {

        const existing =
            await notificationRepository.findById(
                notificationId
            );

        if (!existing) {
            throw new AppError(
                "Notification not found.",
                404
            );
        }

        if (
            existing.recipientUser.toString() !==
            userId.toString()
        ) {
            throw new AppError(
                "Unauthorized.",
                403
            );
        }

        /*
         * Notification already read.
         */
        return existing;
    }

    return notification;
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
        await notificationRepository.softDelete(
            notificationId,
            userId
        );

    if (notification) {
        return notification;
    }

    const existing =
        await notificationRepository.findById(
            notificationId
        );

    if (!existing) {
        throw new AppError(
            "Notification not found.",
            404
        );
    }

    throw new AppError(
        "Unauthorized.",
        403
    );
};


module.exports = {

    createNotification,

    getMyNotifications,

    getUnreadCount,

    markAsRead,

    markAllAsRead,

    deleteNotification,

};