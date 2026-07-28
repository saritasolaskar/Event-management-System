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
        .isFloat(),

    body("speed")
        .optional()
        .isFloat(),

    body("heading")
        .optional()
        .isFloat(),

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