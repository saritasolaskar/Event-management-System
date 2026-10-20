const { body, param } = require("express-validator");

/**
 * Create Guest Assignment Validation
 */
const createGuestAssignmentValidator = [
    body("vehicleAssignment")
        .notEmpty()
        .withMessage("Vehicle Assignment is required.")
        .isMongoId()
        .withMessage("Invalid Vehicle Assignment ID."),

    body("guest")
        .notEmpty()
        .withMessage("Guest is required.")
        .isMongoId()
        .withMessage("Invalid Guest ID."),

    body("pickupSequence")
        .optional()
        .isInt({ min: 1 })
        .withMessage(
            "Pickup sequence must be a positive integer."
        ),

    body("dropSequence")
        .optional()
        .isInt({ min: 1 })
        .withMessage(
            "Drop sequence must be a positive integer."
        ),

    body("remarks")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage(
            "Remarks cannot exceed 500 characters."
        ),
];

/**
 * Bulk Assign Guests Validation
 */
const bulkAssignGuestsValidator = [
    body("vehicleAssignment")
        .notEmpty()
        .withMessage("Vehicle Assignment is required.")
        .isMongoId()
        .withMessage("Invalid Vehicle Assignment ID."),

    body("guests")
        .isArray({ min: 1 })
        .withMessage(
            "Guests must be a non-empty array."
        ),

    body("guests.*")
        .isMongoId()
        .withMessage("Invalid Guest ID."),
];

/**
 * Update Guest Assignment Validation
 */
const updateGuestAssignmentValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Guest Assignment ID."),

    body("vehicleAssignment")
        .optional()
        .isMongoId()
        .withMessage("Invalid Vehicle Assignment ID."),

    body("guest")
        .optional()
        .isMongoId()
        .withMessage("Invalid Guest ID."),

    body("pickupSequence")
        .optional()
        .isInt({ min: 1 })
        .withMessage(
            "Pickup sequence must be a positive integer."
        ),

    body("dropSequence")
        .optional()
        .isInt({ min: 1 })
        .withMessage(
            "Drop sequence must be a positive integer."
        ),

    body("remarks")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage(
            "Remarks cannot exceed 500 characters."
        ),
];

/**
 * Guest Assignment ID Validation
 */
const guestAssignmentIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Guest Assignment ID."),
];

module.exports = {
    createGuestAssignmentValidator,
    bulkAssignGuestsValidator,
    updateGuestAssignmentValidator,
    guestAssignmentIdValidator,
};