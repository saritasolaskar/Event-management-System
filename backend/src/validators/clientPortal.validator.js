const { param } = require("express-validator");

/**
 * Event ID Validator
 */
const eventIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid event ID."),
];

/**
 * Invoice ID Validator
 */
const invoiceIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid invoice ID."),
];

module.exports = {
    eventIdValidator,
    invoiceIdValidator,
};