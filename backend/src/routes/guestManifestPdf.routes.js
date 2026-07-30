const express = require("express");

const router = express.Router();

const controller = require("../controllers/guestManifestPdf.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
    eventIdValidator,
} = require("../validators/event.validator");

router.get(
    "/:id/pdf",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.ACCOUNTS,
        ROLES.CLIENT
    ),
    eventIdValidator,
    validate,
    controller.downloadGuestManifestPdf
);

module.exports = router;