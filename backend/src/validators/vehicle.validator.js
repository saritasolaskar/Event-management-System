
const { body, param } = require("express-validator");

const { VEHICLE_STATUS } = require("../constants/status");

const VEHICLE_TYPES = [
    "HATCHBACK",
    "SEDAN",
    "SUV",
    "MUV",
    "TEMPO_TRAVELLER",
    "MINI_BUS",
    "BUS",
];

const FUEL_TYPES = [
    "PETROL",
    "DIESEL",
    "CNG",
    "ELECTRIC",
    "HYBRID",
];

const normalizeVehicleNumber = (value) =>
    String(value ?? "")
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

/**
 * Create Vehicle Validation
 */
const createVehicleValidator = [
    body("vehicleNumber")
        .customSanitizer(normalizeVehicleNumber)
        .notEmpty()
        .withMessage("Vehicle number is required."),

    body("vehicleType")
        .trim()
        .toUpperCase()
        .notEmpty()
        .withMessage("Vehicle type is required.")
        .isIn(VEHICLE_TYPES)
        .withMessage("Invalid vehicle type."),

    body("brand")
        .optional()
        .trim(),

    body("model")
        .optional()
        .trim(),

    body("manufactureYear")
        .optional()
        .isInt({
            min: 1980,
            max: new Date().getFullYear() + 1,
        })
        .withMessage("Invalid manufacture year.")
        .toInt(),

    body("fuelType")
        .optional()
        .trim()
        .toUpperCase()
        .isIn(FUEL_TYPES)
        .withMessage("Invalid fuel type."),

    body("seatingCapacity")
        .notEmpty()
        .withMessage("Seating capacity is required.")
        .isInt({ min: 1 })
        .withMessage("Seating capacity must be at least 1.")
        .toInt(),

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
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid RC expiry date."),

    body("insuranceExpiry")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid insurance expiry date."),

    body("permitExpiry")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid permit expiry date."),

    body("fitnessExpiry")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid fitness expiry date."),

    body("pucExpiry")
        .optional({ nullable: true })
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

    body("vehicleNumber")
        .optional()
        .customSanitizer(normalizeVehicleNumber)
        .notEmpty()
        .withMessage("Vehicle number cannot be empty."),

    body("vehicleType")
        .optional()
        .trim()
        .toUpperCase()
        .isIn(VEHICLE_TYPES)
        .withMessage("Invalid vehicle type."),

    body("brand")
        .optional()
        .trim(),

    body("model")
        .optional()
        .trim(),

    body("manufactureYear")
        .optional()
        .isInt({
            min: 1980,
            max: new Date().getFullYear() + 1,
        })
        .withMessage("Invalid manufacture year.")
        .toInt(),

    body("fuelType")
        .optional()
        .trim()
        .toUpperCase()
        .isIn(FUEL_TYPES)
        .withMessage("Invalid fuel type."),

    body("seatingCapacity")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Seating capacity must be at least 1.")
        .toInt(),

    body("vendor")
        .optional()
        .isMongoId()
        .withMessage("Invalid vendor ID."),

    body("currentDriver")
        .optional({ nullable: true })
        .isMongoId()
        .withMessage("Invalid driver ID."),

    body("rcExpiry")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid RC expiry date."),

    body("insuranceExpiry")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid insurance expiry date."),

    body("permitExpiry")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid permit expiry date."),

    body("fitnessExpiry")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid fitness expiry date."),

    body("pucExpiry")
        .optional({ nullable: true })
        .isISO8601()
        .withMessage("Invalid PUC expiry date."),

    body("gpsEnabled")
        .optional()
        .isBoolean()
        .withMessage("GPS Enabled must be true or false."),
];

/**
 * Vehicle ID Validation
 */
const vehicleIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid vehicle ID."),
];

/**
 * Vehicle Status Validation
 */
const vehicleStatusValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid vehicle ID."),

    body("status")
        .notEmpty()
        .withMessage("Vehicle status is required.")
        .isIn(Object.values(VEHICLE_STATUS))
        .withMessage("Invalid vehicle status."),
];

module.exports = {
    createVehicleValidator,
    updateVehicleValidator,
    vehicleIdValidator,
    vehicleStatusValidator,
};
