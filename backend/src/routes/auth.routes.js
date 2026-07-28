const express = require("express");

const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate");

const {
  registerValidator,
  loginValidator,
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
  authController.logout
);

module.exports = router;