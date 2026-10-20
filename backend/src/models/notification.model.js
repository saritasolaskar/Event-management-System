const mongoose = require("mongoose");

const {
    NOTIFICATION_TYPE,
} = require("../constants/status");

const NOTIFICATION_REFERENCE_TYPES = Object.freeze([
    "EVENT",
    "DUTY",
    "GUEST_ASSIGNMENT",
    "VEHICLE_ASSIGNMENT",
    "CLIENT_INVOICE",
    "VENDOR_BILL",
    "PAYMENT",
    "SYSTEM",
]);

const notificationSchema = new mongoose.Schema(
    {
        recipientUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },

        type: {
            type: String,
            enum: Object.values(NOTIFICATION_TYPE),
            required: true,
        },

        referenceType: {
            type: String,
            enum: NOTIFICATION_REFERENCE_TYPES,
            default: "SYSTEM",
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
            default: null,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

/*
 * Fast retrieval of a user's latest notifications.
 */
notificationSchema.index({
    recipientUser: 1,
    createdAt: -1,
});

/*
 * Fast unread notification lookup.
 */
notificationSchema.index({
    recipientUser: 1,
    isRead: 1,
    isDeleted: 1,
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);