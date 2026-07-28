const { body, param } = require("express-validator");

const createVehicleAssignmentValidator = [
  body("event").isMongoId().withMessage("Invalid Event ID."),

  body("vendor").isMongoId().withMessage("Invalid Vendor ID."),

  body("vehicle").isMongoId().withMessage("Invalid Vehicle ID."),

  body("driver").isMongoId().withMessage("Invalid Driver ID."),
];

const updateVehicleAssignmentValidator = [
  param("id").isMongoId().withMessage("Invalid Assignment ID."),
];

const vehicleAssignmentIdValidator = [
  param("id").isMongoId().withMessage("Invalid Assignment ID."),
];

module.exports = {
  createVehicleAssignmentValidator,
  updateVehicleAssignmentValidator,
  vehicleAssignmentIdValidator,
};