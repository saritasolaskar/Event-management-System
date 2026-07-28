const { body, param } = require("express-validator");

const { CLIENT_STATUS } = require("../constants/status");

/**
 * Create Client Validation
 */
const createClientValidator = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required.")
    .isLength({ max: 150 })
    .withMessage("Company name cannot exceed 150 characters."),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required.")
    .isEmail()
    .withMessage("Please enter a valid email.")
    .normalizeEmail(),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required."),

  body("gstNumber")
    .optional()
    .trim()
    .isLength({ min: 15, max: 15 })
    .withMessage("GST Number must be 15 characters."),

  body("panNumber")
    .optional()
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage("PAN Number must be 10 characters."),

  body("paymentTerms")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Payment terms must be a positive number."),

  body("creditLimit")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Credit limit cannot be negative."),

  body("status")
    .optional()
    .isIn(Object.values(CLIENT_STATUS))
    .withMessage("Invalid client status."),
];

/**
 * Update Client Validation
 */
const updateClientValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid client ID."),
];

/**
 * Client ID Validation
 */
const clientIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid client ID."),
];

module.exports = {
  createClientValidator,
  updateClientValidator,
  clientIdValidator,
};