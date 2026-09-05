const { body, param } = require("express-validator");

/**
 * Start Duty Validation
 */
const startDutyValidator = [
    body("vehicleAssignment")
        .notEmpty()
        .withMessage("Vehicle Assignment is required.")
        .isMongoId()
        .withMessage("Invalid Vehicle Assignment ID."),

    body("startKm")
        .notEmpty()
        .withMessage("Starting KM is required.")
        .isFloat({ min: 0 })
        .withMessage("Starting KM must be a valid positive number."),
];

/**
 * Complete Duty Validation
 */
const completeDutyValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Duty ID."),

    body("endKm")
        .notEmpty()
        .withMessage("Ending KM is required.")
        .isFloat({ min: 0 })
        .withMessage("Ending KM must be a valid positive number."),
];

/**
 * Update Expenses Validation
 */
const updateExpensesValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Duty ID."),

    body("parkingCharges")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Parking charges cannot be negative."),

    body("tollCharges")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Toll charges cannot be negative."),

    body("entryCharges")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Entry charges cannot be negative."),

    body("daCharges")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("DA charges cannot be negative."),
];

const dutyIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid duty ID."),
];

module.exports = {
    startDutyValidator,
    completeDutyValidator,
    updateExpensesValidator,
    dutyIdValidator,
};