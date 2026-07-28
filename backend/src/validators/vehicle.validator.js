const { body, param } = require("express-validator");

const { VEHICLE_STATUS } = require("../constants/status");

/**
 * Create Vehicle Validation
 */
const createVehicleValidator = [
  body("vehicleNumber")
    .trim()
    .notEmpty()
    .withMessage("Vehicle number is required."),

  body("vehicleType")
    .notEmpty()
    .withMessage("Vehicle type is required.")
    .isIn([
      "HATCHBACK",
      "SEDAN",
      "SUV",
      "MUV",
      "TEMPO_TRAVELLER",
      "MINI_BUS",
      "BUS",
    ])
    .withMessage("Invalid vehicle type."),

  body("brand")
    .optional()
    .trim(),

  body("model")
    .optional()
    .trim(),

  body("manufactureYear")
    .optional()
    .isInt({ min: 1980, max: new Date().getFullYear() + 1 })
    .withMessage("Invalid manufacture year."),

  body("fuelType")
    .optional()
    .isIn([
      "PETROL",
      "DIESEL",
      "CNG",
      "ELECTRIC",
      "HYBRID",
    ])
    .withMessage("Invalid fuel type."),

  body("seatingCapacity")
    .notEmpty()
    .withMessage("Seating capacity is required.")
    .isInt({ min: 1 })
    .withMessage("Invalid seating capacity."),

  body("vendor")
    .notEmpty()
    .withMessage("Vendor is required.")
    .isMongoId()
    .withMessage("Invalid vendor ID."),

  body("currentDriver")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Invalid driver ID."),

  body("rcExpiry")
    .optional()
    .isISO8601()
    .withMessage("Invalid RC expiry date."),

  body("insuranceExpiry")
    .optional()
    .isISO8601()
    .withMessage("Invalid insurance expiry date."),

  body("permitExpiry")
    .optional()
    .isISO8601()
    .withMessage("Invalid permit expiry date."),

  body("fitnessExpiry")
    .optional()
    .isISO8601()
    .withMessage("Invalid fitness expiry date."),

  body("pucExpiry")
    .optional()
    .isISO8601()
    .withMessage("Invalid PUC expiry date."),

  body("gpsEnabled")
    .optional()
    .isBoolean()
    .withMessage("GPS Enabled must be true or false."),

  body("status")
    .optional()
    .isIn(Object.values(VEHICLE_STATUS))
    .withMessage("Invalid vehicle status."),
];

/**
 * Update Vehicle Validation
 */
const updateVehicleValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid vehicle ID."),
];

/**
 * Vehicle ID Validation
 */
const vehicleIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid vehicle ID."),
];

module.exports = {
  createVehicleValidator,
  updateVehicleValidator,
  vehicleIdValidator,
};