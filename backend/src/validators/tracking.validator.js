
const { body, param } = require("express-validator");

const {
    TRIP_STAGE,
} = require("../constants/status");

const trackingLocationValidator = [
    body("latitude")
        .exists()
        .withMessage("Latitude is required.")
        .isFloat({ min: -90, max: 90 })
        .withMessage("Latitude must be between -90 and 90."),

    body("longitude")
        .exists()
        .withMessage("Longitude is required.")
        .isFloat({ min: -180, max: 180 })
        .withMessage("Longitude must be between -180 and 180."),

    body("accuracy")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Accuracy must be a non-negative number."),

    body("speed")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Speed must be a non-negative number."),

    body("heading")
        .optional()
        .isFloat({ min: 0, max: 360 })
        .withMessage("Heading must be between 0 and 360."),

    body("stage")
        .optional()
        .isIn(Object.values(TRIP_STAGE))
        .withMessage("Invalid tracking stage."),
];

const dutyIdValidator = [
    param("dutyId")
        .isMongoId()
        .withMessage("Invalid duty ID."),
];

module.exports = {
    trackingLocationValidator,
    dutyIdValidator,
};
