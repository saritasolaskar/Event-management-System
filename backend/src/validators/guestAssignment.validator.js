const { body, param } = require("express-validator");

const createGuestAssignmentValidator = [
    body("vehicleAssignment")
        .isMongoId()
        .withMessage("Invalid Vehicle Assignment."),

    body("guest")
        .isMongoId()
        .withMessage("Invalid Guest."),

    body("pickupSequence")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Pickup sequence must be greater than 0."),

    body("dropSequence")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Drop sequence must be greater than 0."),
];

const updateGuestAssignmentValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Assignment ID."),
];

const guestAssignmentIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Assignment ID."),
];

module.exports = {
    createGuestAssignmentValidator,
    updateGuestAssignmentValidator,
    guestAssignmentIdValidator,
};