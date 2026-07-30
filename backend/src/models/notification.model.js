const mongoose = require("mongoose");

const NOTIFICATION_TYPES = Object.freeze({

    EVENT_CREATED: "EVENT_CREATED",

    DRIVER_ASSIGNED: "DRIVER_ASSIGNED",

    GUEST_ASSIGNED: "GUEST_ASSIGNED",

    DUTY_STARTED: "DUTY_STARTED",

    DUTY_COMPLETED: "DUTY_COMPLETED",

    VENDOR_BILL_APPROVED: "VENDOR_BILL_APPROVED",

    CLIENT_INVOICE_APPROVED: "CLIENT_INVOICE_APPROVED",

    BILL_SHARED: "BILL_SHARED",

    PAYMENT_RECEIVED: "PAYMENT_RECEIVED",

    SYSTEM: "SYSTEM",

});

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
        },

        message: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: Object.values(NOTIFICATION_TYPES),
            required: true,
        },

        referenceType: {
            type: String,
            enum: [
                "EVENT",
                "DUTY",
                "GUEST_ASSIGNMENT",
                "VEHICLE_ASSIGNMENT",
                "CLIENT_INVOICE",
                "VENDOR_BILL",
                "PAYMENT",
                "SYSTEM",
            ],
            default: "SYSTEM",
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },

    },

    {
        timestamps: true,
    }

);

notificationSchema.index({
    recipientUser: 1,
    createdAt: -1,
});

notificationSchema.index({
    isRead: 1,
});

module.exports = mongoose.model(
    "Notification",
    notificationSchema
);