const express = require("express");

const router = express.Router();

const controller = require("../controllers/dutyPdf.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
    dutyIdValidator,
} = require("../validators/duty.validator");

router.get(
    "/:id/pdf",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.ACCOUNTS,
        ROLES.DRIVER
    ),
    dutyIdValidator,
    validate,
    controller.downloadDutySheetPdf
);

module.exports = router;