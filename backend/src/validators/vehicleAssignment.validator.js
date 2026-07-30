const { body, param } = require("express-validator");

/**
 * Create Vehicle Assignment Validation
 */
const createVehicleAssignmentValidator = [
  body("event")
    .notEmpty()
    .withMessage("Event is required.")
    .isMongoId()
    .withMessage("Invalid Event ID."),

  body("vendor")
    .notEmpty()
    .withMessage("Vendor is required.")
    .isMongoId()
    .withMessage("Invalid Vendor ID."),

  body("vehicle")
    .notEmpty()
    .withMessage("Vehicle is required.")
    .isMongoId()
    .withMessage("Invalid Vehicle ID."),

  body("driver")
    .notEmpty()
    .withMessage("Driver is required.")
    .isMongoId()
    .withMessage("Invalid Driver ID."),

  body("reportingLocation")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid Reporting Location ID."),

  body("reportingTime")
    .optional()
    .isISO8601()
    .withMessage("Invalid Reporting Time."),
];

/**
 * Update Vehicle Assignment Validation
 */
const updateVehicleAssignmentValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid Assignment ID."),
];

/**
 * Vehicle Assignment ID Validation
 */
const vehicleAssignmentIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid Assignment ID."),
];

module.exports = {
  createVehicleAssignmentValidator,
  updateVehicleAssignmentValidator,
  vehicleAssignmentIdValidator,
};