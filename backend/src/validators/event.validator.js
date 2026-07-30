const { body, param } = require("express-validator");

const { EVENT_STATUS } = require("../constants/status");

/**
 * Create Event Validation
 */
const createEventValidator = [
    body("eventCode")
        .trim()
        .notEmpty()
        .withMessage("Event code is required."),

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Event name is required.")
        .isLength({ max: 150 })
        .withMessage("Event name cannot exceed 150 characters."),

    body("client")
        .notEmpty()
        .withMessage("Client is required.")
        .isMongoId()
        .withMessage("Invalid client ID."),

    body("venue")
        .notEmpty()
        .withMessage("Venue is required.")
        .isMongoId()
        .withMessage("Invalid venue ID."),

    body("startDate")
        .notEmpty()
        .withMessage("Start date is required.")
        .isISO8601()
        .withMessage("Invalid start date."),

    body("endDate")
        .notEmpty()
        .withMessage("End date is required.")
        .isISO8601()
        .withMessage("Invalid end date."),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters."),

    body("status")
        .optional()
        .isIn(Object.values(EVENT_STATUS))
        .withMessage("Invalid event status."),
];

/**
 * Update Event Validation
 */
const updateEventValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid event ID."),

    body("eventCode")
        .optional()
        .trim(),

    body("name")
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage("Event name cannot exceed 150 characters."),

    body("client")
        .optional()
        .isMongoId()
        .withMessage("Invalid client ID."),

    body("venue")
        .optional()
        .isMongoId()
        .withMessage("Invalid venue ID."),

    body("startDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid start date."),

    body("endDate")
        .optional()
        .isISO8601()
        .withMessage("Invalid end date."),

    body("description")
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters."),

    body("status")
        .optional()
        .isIn(Object.values(EVENT_STATUS))
        .withMessage("Invalid event status."),
];

/**
 * Event ID Validation
 */
const eventIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid event ID."),
];

module.exports = {
    createEventValidator,
    updateEventValidator,
    eventIdValidator,
};