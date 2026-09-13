const { body, param } = require("express-validator");

const { STATUS } = require("../constants/status");

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
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters."),

  body("pincode")
    .optional()
    .trim()
    .isPostalCode("any")
    .withMessage("Invalid pincode."),

  body("latitude")
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90."),

  body("longitude")
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180."),

  body("landmark")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Landmark cannot exceed 255 characters."),

  body("status")
    .optional()
    .isIn(Object.values(STATUS))
    .withMessage("Invalid location status."),
];

/**
 * Update Location Validation
 */
const updateLocationValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid location ID."),

  body("locationCode")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Location code cannot be empty."),

  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Location name cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Location name cannot exceed 100 characters."),

  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty."),

  body("city")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("City cannot be empty."),

  body("state")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("State cannot be empty."),

  body("country")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Country cannot be empty.")
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters."),

  body("pincode")
    .optional()
    .trim()
    .isPostalCode("any")
    .withMessage("Invalid pincode."),

  body("latitude")
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90."),

  body("longitude")
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180."),

  body("landmark")
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage("Landmark cannot exceed 255 characters."),

  body("status")
    .not()
    .exists()
    .withMessage(
      "Location status must be changed using the status endpoint."
    ),

  body("isDeleted")
    .not()
    .exists()
    .withMessage("isDeleted cannot be modified."),

  body("createdBy")
    .not()
    .exists()
    .withMessage("createdBy cannot be modified."),

  body("updatedBy")
    .not()
    .exists()
    .withMessage("updatedBy cannot be modified."),
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