const { body, param } = require("express-validator");

const { LOCATION_STATUS } = require("../constants/status");

/**
 * Create Location Validation
 */
const createLocationValidator = [
  body("locationCode")
    .trim()
    .notEmpty()
    .withMessage("Location code is required."),

  body("name")
    .trim()
    .notEmpty()
    .withMessage("Location name is required.")
    .isLength({ max: 100 })
    .withMessage("Location name cannot exceed 100 characters."),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required."),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required."),

  body("state")
    .trim()
    .notEmpty()
    .withMessage("State is required."),

  body("country")
    .optional()
    .trim(),

  body("pincode")
    .optional()
    .trim(),

  body("latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Invalid latitude."),

  body("longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Invalid longitude."),

  body("landmark")
    .optional()
    .trim(),

  body("status")
    .optional()
    .isIn(Object.values(LOCATION_STATUS))
    .withMessage("Invalid location status."),
];

/**
 * Update Location Validation
 */
const updateLocationValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid location ID."),
];

/**
 * Location ID Validation
 */
const locationIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid location ID."),
];

module.exports = {
  createLocationValidator,
  updateLocationValidator,
  locationIdValidator,
};