const express = require("express");

const router = express.Router();

const controller = require("../controllers/vendorBill.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
    createVendorBillValidator,
    vendorBillIdValidator,
    dutyIdValidator,
} = require("../validators/vendorBill.validator");

/**
 * Create Vendor Bill
 */
router.post(
    "/:dutyId",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.ACCOUNTS
    ),
    dutyIdValidator,
    createVendorBillValidator,
    validate,
    controller.createVendorBill
);

/**
 * Download Vendor Bill PDF
 */
router.get(
    "/:id/pdf",
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.ACCOUNTS
    ),
    vendorBillIdValidator,
    validate,
    controller.downloadVendorBillPdf
);

module.exports = router;