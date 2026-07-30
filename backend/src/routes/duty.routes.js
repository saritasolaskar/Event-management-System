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
    dutyIdValidator,
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
    dutyIdValidator,
    validate,
    dutyController.getDuty
);

/**
 * Complete Duty
 */
router.patch(
    "/:id/complete",
    protect,
    authorize(ROLES.DRIVER),
    dutyIdValidator,
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
    dutyIdValidator,
    validate,
    dutyController.updateExpenses
);

module.exports = router;