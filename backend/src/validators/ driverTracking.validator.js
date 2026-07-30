const { body, param } = require("express-validator");

const createTrackingValidator = [

    body("latitude")
        .isFloat()
        .withMessage("Invalid Latitude."),

    body("longitude")
        .isFloat()
        .withMessage("Invalid Longitude."),

    body("accuracy")
        .optional()
        .isFloat()
        .withMessage("Invalid Accuracy."),

    body("speed")
        .optional()
        .isFloat()
        .withMessage("Invalid Speed."),

    body("heading")
        .optional()
        .isFloat()
        .withMessage("Invalid Heading."),

    body("stage")
        .notEmpty()
        .withMessage("Trip stage is required.")

];

const dutyIdValidator = [

    param("dutyId")
        .isMongoId()
        .withMessage("Invalid Duty ID.")

];

module.exports = {

    createTrackingValidator,

    dutyIdValidator,

};