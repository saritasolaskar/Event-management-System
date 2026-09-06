const express = require("express");

const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");
const protect = require("../middleware/auth.middleware");
const {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
} = require("../validators/auth.validator");

const router = express.Router();

router.post(
  "/register",
  registerValidator,
  validate,
  authController.register
);

router.post(
  "/login",
  loginValidator,
  validate,
  authController.login
);

router.post(
  "/logout",
  refreshTokenValidator,
  validate,
  authController.logout
);

router.post(
  "/refresh",
  refreshTokenValidator,
  validate,
  authController.refreshToken
);

router.post(
  "/logout-all",
  protect,
  authController.logoutAllDevices
);

module.exports = router;