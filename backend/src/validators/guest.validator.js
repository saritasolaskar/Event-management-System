const { body, param } = require("express-validator");

const { GUEST_STATUS } = require("../constants/status");

/**
 * Create Guest Validation
 */
const createGuestValidator = [
  body("guestCode")
    .trim()
    .notEmpty()
    .withMessage("Guest code is required."),

  body("event")
    .isMongoId()
    .withMessage("Invalid event ID."),

  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required."),

  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Phone number is required."),

  body("pickupLocation")
    .isMongoId()
    .withMessage("Invalid pickup location."),

  body("dropLocation")
    .isMongoId()
    .withMessage("Invalid drop location."),

  body("status")
    .optional()
    .isIn(Object.values(GUEST_STATUS))
    .withMessage("Invalid guest status."),
];

/**
 * Update Guest Validation
 */
const updateGuestValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid guest ID."),
];

/**
 * Guest ID Validation
 */
const guestIdValidator = [
  param("id")
    .isMongoId()
    .withMessage("Invalid guest ID."),
];

module.exports = {
  createGuestValidator,
  updateGuestValidator,
  guestIdValidator,
};