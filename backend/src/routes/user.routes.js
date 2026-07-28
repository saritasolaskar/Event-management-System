const express = require("express");

const authMiddleware = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const ROLES = require("../constants/roles");

const router = express.Router();

router.get(
  "/profile",
  authMiddleware,
  authorize(
    ROLES.SUPER_ADMIN,  
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER,
    ROLES.DRIVER,
    ROLES.CLIENT
  ),
  (req, res) => {
    res.json({
      success: true,
      data: req.user,
    });
  }
);

module.exports = router; 