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

  body("vehicle")
    .optional()
    .isMongoId()
    .withMessage("Invalid Vehicle ID."),

  body("driver")
    .optional()
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

  body("remarks")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters."),
];

/**
 * Vehicle Assignment ID Validation
 */
const vehicleAssignmentIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid Assignment ID."),
];

const updateVehicleAssignmentStatusValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Vehicle Assignment ID."),

    body("status")
        .equals("CANCELLED")
        .withMessage("Only CANCELLED status is allowed."),
];

module.exports = {
  createVehicleAssignmentValidator,
  updateVehicleAssignmentValidator,
  vehicleAssignmentIdValidator,
  updateVehicleAssignmentStatusValidator,
};