const { body } = require("express-validator");

const { ROLES } = require("../constants/roles");

const registerValidator = [

    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("First name is required")
        .isLength({ min: 2, max: 50 })
        .withMessage(
            "First name must be between 2 and 50 characters"
        ),

    body("lastName")
        .trim()
        .notEmpty()
        .withMessage("Last name is required")
        .isLength({ min: 2, max: 50 })
        .withMessage(
            "Last name must be between 2 and 50 characters"
        ),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email address")
        .normalizeEmail(),

    body("phone")
        .trim()
        .notEmpty()
        .withMessage("Phone number is required")
        .isMobilePhone("en-IN")
        .withMessage("Invalid phone number"),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1,
        })
        .withMessage(
            "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character"
        ),

    body("role")
        .optional()
        .isIn(Object.values(ROLES))
        .withMessage("Invalid role"),

];

const loginValidator = [

    body("email")
        .trim()
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Invalid email")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required"),

];

module.exports = {

    registerValidator,

    loginValidator,

};