const express=require("express");

const router=express.Router();

const controller=
require("../controllers/vendorBill.controller");

const protect=
require("../middleware/auth.middleware");

const authorize=
require("../middleware/authorize.middleware");

const {ROLES}=
require("../constants/roles");

router.post(

"/:dutyId",

protect,

authorize(
ROLES.ADMIN,
ROLES.ACCOUNTS
),

createVendorBillValidator,

validate,

controller.createVendorBill

);

router.get(

    "/:id/pdf",

    protect,

    authorize(

        ROLES.ADMIN,

        ROLES.ACCOUNTS

    ),

    controller.downloadVendorBillPdf

);


const validate =
require("../middleware/validate");

const {
createVendorBillValidator
} =
require("../validators/vendorBill.validator");

module.exports=router;