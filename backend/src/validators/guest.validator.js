const {
    body,
    param,
} = require("express-validator");

const {
    GUEST_STATUS,
} = require("../constants/status");

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
        .withMessage(
            "First name cannot exceed 50 characters."
        ),

    body("lastName")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage(
            "Last name cannot exceed 50 characters."
        ),

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

    body("gender")
        .optional()
        .isIn([
            "MALE",
            "FEMALE",
            "OTHER",
        ])
        .withMessage("Invalid gender."),

    body("pickupLocation")
        .notEmpty()
        .withMessage(
            "Pickup location is required."
        )
        .isMongoId()
        .withMessage(
            "Invalid pickup location."
        ),

    body("dropLocation")
        .notEmpty()
        .withMessage(
            "Drop location is required."
        )
        .isMongoId()
        .withMessage(
            "Invalid drop location."
        ),

    body("hotelName")
        .optional()
        .trim(),

    body("roomNumber")
        .optional()
        .trim(),

    body("flightNumber")
        .optional()
        .trim(),

    body("arrivalTime")
        .optional()
        .isISO8601()
        .withMessage(
            "Invalid arrival time."
        ),

    body("departureTime")
        .optional()
        .isISO8601()
        .withMessage(
            "Invalid departure time."
        ),

    body("remarks")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage(
            "Remarks cannot exceed 500 characters."
        ),

    body("status")
        .optional()
        .isIn(
            Object.values(GUEST_STATUS)
        )
        .withMessage(
            "Invalid guest status."
        ),
];

/**
 * Update Guest Validation
 */
const updateGuestValidator = [
    param("id")
        .isMongoId()
        .withMessage(
            "Invalid guest ID."
        ),

    body("event")
        .optional()
        .isMongoId()
        .withMessage(
            "Invalid event ID."
        ),

    body("firstName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "First name cannot be empty."
        )
        .isLength({ max: 50 })
        .withMessage(
            "First name cannot exceed 50 characters."
        ),

    body("lastName")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage(
            "Last name cannot exceed 50 characters."
        ),

    body("phone")
        .optional()
        .trim()
        .notEmpty()
        .withMessage(
            "Phone number cannot be empty."
        ),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage(
            "Invalid email address."
        )
        .normalizeEmail(),

    body("gender")
        .optional()
        .isIn([
            "MALE",
            "FEMALE",
            "OTHER",
        ])
        .withMessage(
            "Invalid gender."
        ),

    body("pickupLocation")
        .optional()
        .isMongoId()
        .withMessage(
            "Invalid pickup location."
        ),

    body("dropLocation")
        .optional()
        .isMongoId()
        .withMessage(
            "Invalid drop location."
        ),

    body("hotelName")
        .optional()
        .trim(),

    body("roomNumber")
        .optional()
        .trim(),

    body("flightNumber")
        .optional()
        .trim(),

    body("arrivalTime")
        .optional()
        .isISO8601()
        .withMessage(
            "Invalid arrival time."
        ),

    body("departureTime")
        .optional()
        .isISO8601()
        .withMessage(
            "Invalid departure time."
        ),

    body("remarks")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage(
            "Remarks cannot exceed 500 characters."
        ),
];

/**
 * Guest ID Validation
 */
const guestIdValidator = [
    param("id")
        .isMongoId()
        .withMessage(
            "Invalid guest ID."
        ),
];

/**
 * Event ID Validation
 */
const eventIdValidator = [
    param("eventId")
        .isMongoId()
        .withMessage(
            "Invalid event ID."
        ),
];

/**
 * Guest Status Validation
 */
const guestStatusValidator = [
    param("id")
        .isMongoId()
        .withMessage(
            "Invalid guest ID."
        ),

    body("status")
        .notEmpty()
        .withMessage(
            "Guest status is required."
        )
        .isIn(
            Object.values(GUEST_STATUS)
        )
        .withMessage(
            "Invalid guest status."
        ),
];

module.exports = {
    createGuestValidator,
    updateGuestValidator,
    guestIdValidator,
    eventIdValidator,
    guestStatusValidator,
};