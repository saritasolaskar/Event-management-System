const Notification =
require("../models/notification.model");

/**
 * Create Notification
 */
const create = (data) =>
    Notification.create(data);

/**
 * Find Notification By ID
 */
const findById = (id) =>
    Notification.findOne({
        _id: id,
        isDeleted: false,
    });

/**
 * Get Notifications Of User
 */
const findByRecipient = (recipientUser) => {

    return Notification.find({
        recipientUser,
        isDeleted: false,
    }).sort({
        createdAt: -1,
    });

};

/**
 * Mark One Notification As Read
 */
const markAsRead = (id) => {

    return Notification.findByIdAndUpdate(

        id,

        {
            isRead: true,
            readAt: new Date(),
        },

        {
            new: true,
            runValidators: true,
        }

    );

};

/**
 * Mark All Notifications As Read
 */
const markAllAsRead = (recipientUser) => {

    return Notification.updateMany(

        {
            recipientUser,
            isRead: false,
            isDeleted: false,
        },

        {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
        }

    );

};

/**
 * Soft Delete Notification
 */
const softDelete = (id) => {

    return Notification.findByIdAndUpdate(

        id,

        {
            isDeleted: true,
        },

        {
            new: true,
        }

    );

};

module.exports = {

    create,

    findById,

    findByRecipient,

    markAsRead,

    markAllAsRead,

    softDelete,

};