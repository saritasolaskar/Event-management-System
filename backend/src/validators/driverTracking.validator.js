const { body, param } = require("express-validator");

const {
    TRIP_STAGE,
} = require("../constants/status");

const createTrackingValidator = [

    body("latitude")
        .isFloat({
            min: -90,
            max: 90,
        })
        .withMessage("Invalid Latitude."),

    body("longitude")
        .isFloat({
            min: -180,
            max: 180,
        })
        .withMessage("Invalid Longitude."),

    body("accuracy")
        .optional()
        .isFloat({
            min: 0,
        })
        .withMessage("Invalid Accuracy."),

    body("speed")
        .optional()
        .isFloat({
            min: 0,
        })
        .withMessage("Invalid Speed."),

    body("heading")
        .optional()
        .isFloat({
            min: 0,
            max: 360,
        })
        .withMessage("Invalid Heading."),

    body("stage")
        .isIn(Object.values(TRIP_STAGE))
        .withMessage("Invalid Trip Stage."),

];

const dutyIdValidator = [

    param("dutyId")
        .isMongoId()
        .withMessage("Invalid Duty ID."),

];

module.exports = {

    createTrackingValidator,

    dutyIdValidator,

};