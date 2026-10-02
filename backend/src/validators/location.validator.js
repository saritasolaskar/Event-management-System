const {
    body,
    param,
} = require("express-validator");

const {
    STATUS,
} = require("../constants/status");

/**
 * Create Location Validation
 */
const createLocationValidator = [

    body("locationCode")
        .isString()
        .withMessage(
            "Location code must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "Location code is required."
        ),

    body("name")
        .isString()
        .withMessage(
            "Location name must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "Location name is required."
        )
        .isLength({ max: 100 })
        .withMessage(
            "Location name cannot exceed 100 characters."
        ),

    body("address")
        .isString()
        .withMessage(
            "Address must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "Address is required."
        ),

    body("city")
        .isString()
        .withMessage(
            "City must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "City is required."
        ),

    body("state")
        .isString()
        .withMessage(
            "State must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "State is required."
        ),

    body("country")
        .optional()
        .isString()
        .withMessage(
            "Country must be a string."
        )
        .trim()
        .isLength({ max: 100 })
        .withMessage(
            "Country cannot exceed 100 characters."
        ),

    body("pincode")
        .optional()
        .isString()
        .withMessage(
            "Pincode must be a string."
        )
        .trim()
        .isPostalCode("any")
        .withMessage(
            "Invalid pincode."
        ),

    body("latitude")
        .optional({ nullable: true })
        .isFloat({
            min: -90,
            max: 90,
        })
        .withMessage(
            "Latitude must be between -90 and 90."
        ),

    body("longitude")
        .optional({ nullable: true })
        .isFloat({
            min: -180,
            max: 180,
        })
        .withMessage(
            "Longitude must be between -180 and 180."
        ),

    body("landmark")
        .optional()
        .isString()
        .withMessage(
            "Landmark must be a string."
        )
        .trim()
        .isLength({ max: 255 })
        .withMessage(
            "Landmark cannot exceed 255 characters."
        ),
];

/**
 * Update Location Validation
 */
const updateLocationValidator = [

    param("id")
        .isMongoId()
        .withMessage(
            "Invalid location ID."
        ),

    body("locationCode")
        .optional()
        .isString()
        .withMessage(
            "Location code must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "Location code cannot be empty."
        ),

    body("name")
        .optional()
        .isString()
        .withMessage(
            "Location name must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "Location name cannot be empty."
        )
        .isLength({ max: 100 })
        .withMessage(
            "Location name cannot exceed 100 characters."
        ),

    body("address")
        .optional()
        .isString()
        .withMessage(
            "Address must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "Address cannot be empty."
        ),

    body("city")
        .optional()
        .isString()
        .withMessage(
            "City must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "City cannot be empty."
        ),

    body("state")
        .optional()
        .isString()
        .withMessage(
            "State must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "State cannot be empty."
        ),

    body("country")
        .optional()
        .isString()
        .withMessage(
            "Country must be a string."
        )
        .trim()
        .notEmpty()
        .withMessage(
            "Country cannot be empty."
        )
        .isLength({ max: 100 })
        .withMessage(
            "Country cannot exceed 100 characters."
        ),

    body("pincode")
        .optional()
        .isString()
        .withMessage(
            "Pincode must be a string."
        )
        .trim()
        .isPostalCode("any")
        .withMessage(
            "Invalid pincode."
        ),

    body("latitude")
        .optional({ nullable: true })
        .isFloat({
            min: -90,
            max: 90,
        })
        .withMessage(
            "Latitude must be between -90 and 90."
        ),

    body("longitude")
        .optional({ nullable: true })
        .isFloat({
            min: -180,
            max: 180,
        })
        .withMessage(
            "Longitude must be between -180 and 180."
        ),

    body("landmark")
        .optional()
        .isString()
        .withMessage(
            "Landmark must be a string."
        )
        .trim()
        .isLength({ max: 255 })
        .withMessage(
            "Landmark cannot exceed 255 characters."
        ),

    body("status")
        .not()
        .exists()
        .withMessage(
            "Location status must be changed using the status endpoint."
        ),

    body("isDeleted")
        .not()
        .exists()
        .withMessage(
            "isDeleted cannot be modified."
        ),

    body("createdBy")
        .not()
        .exists()
        .withMessage(
            "createdBy cannot be modified."
        ),

    body("updatedBy")
        .not()
        .exists()
        .withMessage(
            "updatedBy cannot be modified."
        ),
];

/**
 * Location ID Validation
 */
const locationIdValidator = [

    param("id")
        .isMongoId()
        .withMessage(
            "Invalid location ID."
        ),
];

module.exports = {
    createLocationValidator,
    updateLocationValidator,
    locationIdValidator,
};