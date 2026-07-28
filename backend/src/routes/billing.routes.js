const express = require("express");

const router = express.Router();

const billingController =
require("../controllers/billing.controller");

const protect =
require("../middleware/auth.middleware");

const authorize =
require("../middleware/authorize.middleware");

const { ROLES } =
require("../constants/roles");

router.get(
    "/draft/:dutyId",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.ACCOUNTS
    ),
    billingController.generateDraftBill
);

module.exports=router;