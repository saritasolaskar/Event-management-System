const { param } = require("express-validator");

/**
 * Create Vendor Bill Validation
 */
const createVendorBillValidator = [
  param("dutyId")
    .notEmpty()
    .withMessage("Duty ID is required.")
    .isMongoId()
    .withMessage("Invalid Duty ID."),
];

/**
 * Vendor Bill ID Validation
 */
const vendorBillIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Vendor Bill ID is required.")
    .isMongoId()
    .withMessage("Invalid Vendor Bill ID."),
];

module.exports = {
  createVendorBillValidator,
  vendorBillIdValidator,
};