const { body, param } = require("express-validator");

const { DRIVER_STATUS } = require("../constants/status");

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

    body("rating")
        .optional()
        .isFloat({ min: 0, max: 5 })
        .withMessage("Rating must be between 0 and 5.")
        .toFloat(),

    body("status")
        .optional()
        .isIn(Object.values(DRIVER_STATUS))
        .withMessage("Invalid driver status."),

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
        .isLength({ max: 50 })
        .withMessage("First name cannot exceed 50 characters."),

    body("lastName")
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage("Last name cannot exceed 50 characters."),

    body("phone")
        .optional()
        .trim()
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number."),

    body("email")
        .optional()
        .trim()
        .isEmail()
        .withMessage("Please enter a valid email.")
        .normalizeEmail(),

    body("vendor")
        .optional()
        .isMongoId()
        .withMessage("Invalid vendor ID."),

    body("currentVehicle")
        .optional({ nullable: true })
        .isMongoId()
        .withMessage("Invalid vehicle ID."),

    body("status")
        .optional()
        .isIn(Object.values(DRIVER_STATUS))
        .withMessage("Invalid driver status."),

];

/**
 * Driver ID Validation
 */
const driverIdValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid driver ID."),

];

module.exports = {

    createDriverValidator,

    updateDriverValidator,

    driverIdValidator,

};