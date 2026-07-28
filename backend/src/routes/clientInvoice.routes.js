const express = require("express");

const router = express.Router();

const controller =
require("../controllers/clientInvoice.controller");

const protect =
require("../middleware/auth.middleware");

const authorize =
require("../middleware/authorize.middleware");

const validate =
require("../middleware/validate");

const { ROLES } =
require("../constants/roles");

const {
createClientInvoiceValidator,
} =
require("../validators/clientInvoice.validator");

router.post(

"/:dutyId",

protect,

authorize(
ROLES.ADMIN,
ROLES.ACCOUNTS
),

createClientInvoiceValidator,

validate,

controller.createClientInvoice

);


router.get(

    "/:id/pdf",

    protect,

    authorize(

        ROLES.ADMIN,

        ROLES.ACCOUNTS,

        ROLES.CLIENT

    ),

    controller.downloadInvoicePdf

);

module.exports = router;