const mongoose = require("mongoose");

const AUDIT_ACTIONS = Object.freeze({

    CREATE: "CREATE",

    UPDATE: "UPDATE",

    DELETE: "DELETE",

    APPROVE: "APPROVE",

    REJECT: "REJECT",

    SHARE: "SHARE",

    LOGIN: "LOGIN",

    LOGOUT: "LOGOUT",

    ASSIGN: "ASSIGN",

    START: "START",

    COMPLETE: "COMPLETE",

    PAYMENT: "PAYMENT",

});

const AUDIT_MODULES = Object.freeze({

    USER: "USER",

    CLIENT: "CLIENT",

    VENDOR: "VENDOR",

    DRIVER: "DRIVER",

    VEHICLE: "VEHICLE",

    EVENT: "EVENT",

    GUEST: "GUEST",

    GUEST_ASSIGNMENT: "GUEST_ASSIGNMENT",

    VEHICLE_ASSIGNMENT: "VEHICLE_ASSIGNMENT",

    DUTY: "DUTY",

    CLIENT_INVOICE: "CLIENT_INVOICE",

    VENDOR_BILL: "VENDOR_BILL",

    BILLING: "BILLING",

    PAYMENT: "PAYMENT",

    NOTIFICATION: "NOTIFICATION",

    SYSTEM: "SYSTEM",

});

const auditLogSchema = new mongoose.Schema(

    {

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        action: {
            type: String,
            enum: Object.values(AUDIT_ACTIONS),
            required: true,
        },

        module: {
            type: String,
            enum: Object.values(AUDIT_MODULES),
            required: true,
            index: true,
        },

        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        ipAddress: {
            type: String,
            trim: true,
        },

        userAgent: {
            type: String,
            trim: true,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

    },

    {
        timestamps: true,
    }

);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

auditLogSchema.index({

    module: 1,

    referenceId: 1,

});

auditLogSchema.index({

    createdAt: -1,

});

module.exports = mongoose.model(

    "AuditLog",

    auditLogSchema

);