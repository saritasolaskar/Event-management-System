```js
const { body, param } = require("express-validator");

const { STATUS } = require("../constants/status");

/**
 * Create Driver Validation
 */
const createDriverValidator = [

    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required.")
        .isLength({ max: 50 })
        .withMessage("First name cannot exceed 50 characters."),

    body("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required.")
        .isLength({ max: 50 })
        .withMessage("Last name cannot exceed 50 characters."),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required.")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number."),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email.")
        .normalizeEmail(),

    body("dateOfBirth")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Invalid date of birth."),

    body("gender")
        .optional()
        .isIn(["MALE", "FEMALE", "OTHER"])
        .withMessage("Invalid gender."),

    body("vendor")
        .notEmpty()
        .withMessage("Vendor is required.")
        .isMongoId()
        .withMessage("Invalid vendor ID."),

    body("currentVehicle")
        .optional({ nullable: true })
        .isMongoId()
        .withMessage("Invalid vehicle ID."),

    body("licenseNumber")
        .trim()
        .notEmpty()
        .withMessage("License number is required.")
        .isLength({ min: 8, max: 20 })
        .withMessage("Invalid license number."),

    body("licenseExpiry")
        .notEmpty()
        .withMessage("License expiry is required.")
        .isISO8601({ strict: true })
        .withMessage("Invalid license expiry date."),

    body("badgeNumber")
        .optional()
        .trim()
        .isLength({ max: 30 })
        .withMessage("Badge number cannot exceed 30 characters."),

    body("policeVerificationExpiry")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Invalid police verification expiry date."),

    body("medicalCertificateExpiry")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Invalid medical certificate expiry date."),

];

/**
 * Update Driver Validation
 */
const updateDriverValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid driver ID."),

    body("firstName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("First name cannot be empty.")
        .isLength({ max: 50 })
        .withMessage("First name cannot exceed 50 characters."),

    body("lastName")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Last name cannot be empty.")
        .isLength({ max: 50 })
        .withMessage("Last name cannot exceed 50 characters."),

    body("phone")
        .optional()
        .trim()
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number."),

    body("email")
        .optional({ nullable: true })
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email.")
        .normalizeEmail(),

    body("dateOfBirth")
        .optional({ nullable: true })
        .isISO8601({ strict: true })
        .withMessage("Invalid date of birth."),

    body("gender")
        .optional()
        .isIn(["MALE", "FEMALE", "OTHER"])
        .withMessage("Invalid gender."),

    body("address")
        .optional()
        .trim(),

    body("city")
        .optional()
        .trim(),

    body("state")
        .optional()
        .trim(),

    body("pincode")
        .optional()
        .trim()
        .isLength({ max: 10 })
        .withMessage("Invalid pincode."),

    body("vendor")
        .optional()
        .isMongoId()
        .withMessage("Invalid vendor ID."),

    body("currentVehicle")
        .optional({ nullable: true })
        .isMongoId()
        .withMessage("Invalid vehicle ID."),

    body("licenseNumber")
        .optional()
        .trim()
        .isLength({ min: 8, max: 20 })
        .withMessage("Invalid license number."),

    body("licenseExpiry")
        .optional()
        .isISO8601({ strict: true })
        .withMessage("Invalid license expiry date."),

    body("badgeNumber")
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 30 })
        .withMessage("Badge number cannot exceed 30 characters."),

    body("policeVerificationExpiry")
        .optional({ nullable: true })
        .isISO8601({ strict: true })
        .withMessage("Invalid police verification expiry date."),

    body("medicalCertificateExpiry")
        .optional({ nullable: true })
        .isISO8601({ strict: true })
        .withMessage("Invalid medical certificate expiry date."),

];

/**
 * Driver ID Validation
 */
const driverIdValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid driver ID."),

];

/**
 * Driver Status Validation
 */
const driverStatusValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid driver ID."),

    body("status")
        .notEmpty()
        .withMessage("Driver status is required.")
        .isIn(Object.values(STATUS))
        .withMessage("Invalid driver status."),

];

module.exports = {

    createDriverValidator,

    updateDriverValidator,

    driverIdValidator,

    driverStatusValidator,

};
```
