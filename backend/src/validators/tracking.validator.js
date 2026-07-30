const { body, param } = require("express-validator");

const updateLocationValidator = [

    body("latitude")
        .notEmpty()
        .withMessage("Latitude is required.")
        .isFloat({
            min: -90,
            max: 90,
        })
        .withMessage("Invalid latitude."),

    body("longitude")
        .notEmpty()
        .withMessage("Longitude is required.")
        .isFloat({
            min: -180,
            max: 180,
        })
        .withMessage("Invalid longitude."),

    body("accuracy")
        .optional()
        .isFloat({
            min: 0,
        })
        .withMessage("Invalid accuracy."),

    body("speed")
        .optional()
        .isFloat({
            min: 0,
        })
        .withMessage("Invalid speed."),

    body("heading")
        .optional()
        .isFloat({
            min: 0,
            max: 360,
        })
        .withMessage("Invalid heading."),

    body("stage")
        .optional()
        .isIn([
            "STARTED",
            "EN_ROUTE_PICKUP",
            "AT_PICKUP",
            "EN_ROUTE_DROP",
            "AT_DROP",
            "COMPLETED",
        ])
        .withMessage("Invalid tracking stage."),

];

const dutyIdValidator = [

    param("dutyId")
        .isMongoId()
        .withMessage("Invalid Duty ID."),

];

module.exports = {

    updateLocationValidator,

    dutyIdValidator,

};