const Notification =
    require("../models/notification.model");

/**
 * Create Notification
 */
const create = (
    data,
    session = null
) => {
    const query =
        Notification.create(
            [data],
            session
                ? { session }
                : undefined
        );

    return query.then(
        (documents) => documents[0]
    );
};


/**
 * Find Notification By ID
 */
const findById = (
    id,
    recipientUser = null
) => {

    const filter = {
        _id: id,
        isDeleted: false,
    };

    if (recipientUser) {
        filter.recipientUser =
            recipientUser;
    }

    return Notification.findOne(
        filter
    );
};


/**
 * Get Notifications Of User
 */
const findByRecipient = (
    recipientUser
) => {

    return Notification.find({
        recipientUser,
        isDeleted: false,
    })
        .sort({
            createdAt: -1,
        });
};


/**
 * Mark One Notification As Read
 *
 * Ownership is enforced inside the
 * database query itself.
 */
const markAsRead = (
    id,
    recipientUser
) => {

    return Notification.findOneAndUpdate(
        {
            _id: id,
            recipientUser,
            isDeleted: false,
            isRead: false,
        },
        {
            $set: {
                isRead: true,
                readAt: new Date(),
            },
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
const markAllAsRead = (
    recipientUser
) => {

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
 *
 * Ownership is enforced by the query.
 */
const softDelete = (
    id,
    recipientUser
) => {

    return Notification.findOneAndUpdate(
        {
            _id: id,
            recipientUser,
            isDeleted: false,
        },
        {
            $set: {
                isDeleted: true,
                deletedAt: new Date(),
            },
        },
        {
            new: true,
        }
    );
};


/**
 * Get Unread Count
 */
const countUnread = (
    recipientUser
) => {

    return Notification.countDocuments({
        recipientUser,
        isRead: false,
        isDeleted: false,
    });
};


module.exports = {

    create,

    findById,

    findByRecipient,

    markAsRead,

    markAllAsRead,

    softDelete,

    countUnread,

};