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

    body("DA")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("DA cannot be negative."),

    body("toll")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Toll cannot be negative."),

    body("parking")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Parking cannot be negative."),

    body("entry")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Entry cannot be negative."),

    body("remarks")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Remarks cannot exceed 500 characters."),
];

/**
 * Duty ID Validation
 */
const dutyIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Duty ID."),
];

module.exports = {
    startDutyValidator,
    completeDutyValidator,
    updateExpensesValidator,
    dutyIdValidator,
};