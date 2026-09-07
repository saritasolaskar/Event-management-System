const { body, param } = require("express-validator");

const commercialPackageIdValidator = [
    param("id")
        .isMongoId()
        .withMessage("Invalid Commercial Package ID."),
];

const createCommercialPackageValidator = [
    body("name")
        .notEmpty()
        .withMessage("Package name is required.")
        .isString()
        .trim()
        .isLength({ max: 150 })
        .withMessage("Package name cannot exceed 150 characters."),

    body("description")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters."),

    body("vendorBaseRate")
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor base rate."),

    body("vendorIncludedKm")
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor included KM."),

    body("vendorExtraKmRate")
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor extra KM rate."),

    body("vendorIncludedHours")
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor included hours."),

    body("vendorExtraHourRate")
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor extra hour rate."),

    body("clientBaseRate")
        .isFloat({ min: 0 })
        .withMessage("Invalid client base rate."),

    body("clientIncludedKm")
        .isFloat({ min: 0 })
        .withMessage("Invalid client included KM."),

    body("clientExtraKmRate")
        .isFloat({ min: 0 })
        .withMessage("Invalid client extra KM rate."),

    body("clientIncludedHours")
        .isFloat({ min: 0 })
        .withMessage("Invalid client included hours."),

    body("clientExtraHourRate")
        .isFloat({ min: 0 })
        .withMessage("Invalid client extra hour rate."),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be boolean."),
];

const updateCommercialPackageValidator = [
    ...commercialPackageIdValidator,

    body("name")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 150 })
        .withMessage("Package name cannot exceed 150 characters."),

    body("description")
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage("Description cannot exceed 500 characters."),

    body("vendorBaseRate")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor base rate."),

    body("vendorIncludedKm")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor included KM."),

    body("vendorExtraKmRate")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor extra KM rate."),

    body("vendorIncludedHours")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor included hours."),

    body("vendorExtraHourRate")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid vendor extra hour rate."),

    body("clientBaseRate")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid client base rate."),

    body("clientIncludedKm")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid client included KM."),

    body("clientExtraKmRate")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid client extra KM rate."),

    body("clientIncludedHours")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid client included hours."),

    body("clientExtraHourRate")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Invalid client extra hour rate."),

    body("isActive")
        .optional()
        .isBoolean()
        .withMessage("isActive must be boolean."),
];

module.exports = {
    commercialPackageIdValidator,
    createCommercialPackageValidator,
    updateCommercialPackageValidator,
};