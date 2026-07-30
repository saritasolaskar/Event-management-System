const { body, param } = require("express-validator");

const { VENDOR_STATUS } = require("../constants/status");

/**
 * Create Vendor Validation
 */
const createVendorValidator = [
  body("companyName")
    .trim()
    .notEmpty()
    .withMessage("Company name is required.")
    .isLength({ max: 150 })
    .withMessage("Company name cannot exceed 150 characters."),

  body("ownerName")
    .trim()
    .notEmpty()
    .withMessage("Owner name is required.")
    .isLength({ max: 100 })
    .withMessage("Owner name cannot exceed 100 characters."),

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
    .isMobilePhone("any")
    .withMessage("Invalid phone number."),

  body("gstNumber")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 15, max: 15 })
    .withMessage("GST Number must be exactly 15 characters."),

  body("panNumber")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 10, max: 10 })
    .withMessage("PAN Number must be exactly 10 characters."),

  body("paymentCycle")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Payment cycle must be a positive number."),

  body("commissionType")
    .optional()
    .isIn(["PERCENTAGE", "FIXED"])
    .withMessage("Invalid commission type."),

  body("commissionValue")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Commission value cannot be negative."),

  body("status")
    .optional()
    .isIn(Object.values(VENDOR_STATUS))
    .withMessage("Invalid vendor status."),
];

/**
 * Update Vendor Validation
 */
const updateVendorValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid vendor ID."),
];

/**
 * Vendor ID Validation
 */
const vendorIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid vendor ID."),
];

module.exports = {
  createVendorValidator,
  updateVendorValidator,
  vendorIdValidator,
};