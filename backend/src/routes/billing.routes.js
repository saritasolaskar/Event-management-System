const express = require("express");

const router = express.Router();

const billingController =
    require("../controllers/billing.controller");

const protect =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/authorize.middleware");

const validate =
    require("../middleware/validate");

const { ROLES } =
    require("../constants/roles");

const {
    dutyIdValidator,
} = require("../validators/duty.validator");

router.get(
    "/draft/:dutyId",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.ACCOUNTS
    ),
    dutyIdValidator,
    validate,
    billingController.generateDraftBill
);

module.exports = router;