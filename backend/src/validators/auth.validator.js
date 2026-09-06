const { body } = require("express-validator");

const { ROLES } = require("../constants/roles");

const registerValidator = [

    body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),

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
const refreshTokenValidator = [
  body("refreshToken")
    .notEmpty()
    .withMessage("Refresh token is required."),
];

module.exports = {

    registerValidator,
    loginValidator,
    refreshTokenValidator,

   

};