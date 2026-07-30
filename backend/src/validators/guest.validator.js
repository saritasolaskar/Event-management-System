const { body, param } = require("express-validator");

const { GUEST_STATUS } = require("../constants/status");

/**
 * Create Guest Validation
 */
const createGuestValidator = [
    body("guestCode")
        .trim()
        .notEmpty()
        .withMessage("Guest code is required."),

    body("event")
        .notEmpty()
        .withMessage("Event is required.")
        .isMongoId()
        .withMessage("Invalid event ID."),

    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required.")
        .isLength({ max: 50 })
        .withMessage("First name cannot exceed 50 characters."),

    body("lastName")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage("Last name cannot exceed 50 characters."),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required."),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Invalid email address.")
        .normalizeEmail(),

    body("pickupLocation")
        .notEmpty()
        .withMessage("Pickup location is required.")
        .isMongoId()
        .withMessage("Invalid pickup location."),

    body("dropLocation")
        .notEmpty()
        .withMessage("Drop location is required.")
        .isMongoId()
        .withMessage("Invalid drop location."),

    body("status")
        .optional()
        .isIn(Object.values(GUEST_STATUS))
        .withMessage("Invalid guest status."),
];

/**
 * Update Guest Validation
 */
const updateGuestValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid guest ID."),
];

/**
 * Guest ID Validation
 */
const guestIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid guest ID."),
];

module.exports = {
    createGuestValidator,
    updateGuestValidator,
    guestIdValidator,
};