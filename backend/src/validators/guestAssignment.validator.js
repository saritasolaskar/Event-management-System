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
];

/**
 * Update Guest Assignment Validation
 */
const updateGuestAssignmentValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Guest Assignment ID."),
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
    updateGuestAssignmentValidator,
    guestAssignmentIdValidator,
};