const { body, param } = require("express-validator");

const startDutyValidator = [

    body("vehicleAssignment")
        .isMongoId(),

    body("startKm")
        .isNumeric(),

];

const completeDutyValidator = [

    param("id")
        .isMongoId(),

    body("endKm")
        .isNumeric(),

];

module.exports = {
    startDutyValidator,
    completeDutyValidator,
};