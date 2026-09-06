const { body, param } = require("express-validator");

const { STATUS } = require("../constants/status");

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
        .withMessage("Phone number is required.")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number."),

    body("gstNumber")
        .optional()
        .trim()
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage("Invalid GST Number."),

    body("panNumber")
        .optional()
        .trim()
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        .withMessage("Invalid PAN Number."),

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
        .isIn(Object.values(STATUS))
        .withMessage("Invalid client status."),

];

/**
 * Update Client Validation
 */
const updateClientValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid client ID."),

    body("companyName")
        .optional()
        .trim()
        .isLength({ max: 150 })
        .withMessage("Company name cannot exceed 150 characters."),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email.")
        .normalizeEmail(),

    body("phone")
        .optional()
        .trim()
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number."),

    body("gstNumber")
        .optional()
        .trim()
        .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
        .withMessage("Invalid GST Number."),

    body("panNumber")
        .optional()
        .trim()
        .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
        .withMessage("Invalid PAN Number."),

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
        .isIn(Object.values(STATUS))
        .withMessage("Invalid client status."),

];

/**
 * Client ID Validation
 */
const clientIdValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid client ID.")

];

const updateClientStatusValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid client ID."),

  body("status")
    .notEmpty()
    .withMessage("Client status is required.")
    .isIn(Object.values(STATUS))
    .withMessage("Invalid client status."),
];

module.exports = {

    createClientValidator,

    updateClientValidator,
    updateClientStatusValidator,
    clientIdValidator,

};