const { param } = require("express-validator");

/**
 * Validate Audit Log ID
 */
const auditLogIdValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid Audit Log ID."),

];

/**
 * Validate User ID
 */
const auditLogUserValidator = [

    param("userId")
        .isMongoId()
        .withMessage("Invalid User ID."),

];

/**
 * Validate Module Name
 */
const auditLogModuleValidator = [

    param("module")
        .isIn([

            "USER",

            "CLIENT",

            "VENDOR",

            "DRIVER",

            "VEHICLE",

            "EVENT",

            "GUEST",

            "GUEST_ASSIGNMENT",

            "VEHICLE_ASSIGNMENT",

            "DUTY",

            "CLIENT_INVOICE",

            "VENDOR_BILL",

            "BILLING",

            "PAYMENT",

            "NOTIFICATION",

            "SYSTEM",

        ])
        .withMessage("Invalid module."),

];

/**
 * Validate Module + Reference ID
 */
const auditLogReferenceValidator = [

    ...auditLogModuleValidator,

    param("referenceId")
        .isMongoId()
        .withMessage("Invalid Reference ID."),

];

module.exports = {

    auditLogIdValidator,

    auditLogUserValidator,

    auditLogModuleValidator,

    auditLogReferenceValidator,

};