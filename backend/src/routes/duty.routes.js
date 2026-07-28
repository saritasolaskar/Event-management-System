const express = require("express");

const router = express.Router();

const dutyController = require("../controllers/duty.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
    startDutyValidator,
    completeDutyValidator,
} = require("../validators/duty.validator");

/**
 * Start Duty
 */
router.post(
    "/",
    protect,
    authorize(ROLES.DRIVER),
    startDutyValidator,
    validate,
    dutyController.startDuty
);

/**
 * Get Duty
 */
router.get(
    "/:id",
    protect,
    dutyController.getDuty
);

/**
 * Complete Duty
 */
router.patch(
    "/:id/complete",
    protect,
    authorize(ROLES.DRIVER),
    completeDutyValidator,
    validate,
    dutyController.completeDuty
);

/**
 * Update Expenses
 */
router.patch(
    "/:id/expenses",
    protect,
    authorize(ROLES.DRIVER),
    dutyController.updateExpenses
);

module.exports = router;