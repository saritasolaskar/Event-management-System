const express = require("express");

const router = express.Router();

const controller =
    require("../controllers/billingApproval.controller");

const protect =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/authorize.middleware");

const validate =
    require("../middleware/validate");

const { ROLES } =
    require("../constants/roles");

const {
    approvalRemarksValidator,
    paymentValidator,
} =
    require("../validators/billingApproval.validator");


router.use(
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.ACCOUNTS
    )
);


// ============================
// Vendor Bill
// ============================

router.patch(
    "/vendor/:id/approve",
    approvalRemarksValidator,
    validate,
    controller.approveVendorBill
);

router.patch(
    "/vendor/:id/reject",
    approvalRemarksValidator,
    validate,
    controller.rejectVendorBill
);

router.patch(
    "/vendor/:id/share",
    approvalRemarksValidator,
    validate,
    controller.shareVendorBill
);

router.patch(
    "/vendor/:id/paid",
    paymentValidator,
    validate,
    controller.markVendorBillPaid
);


// ============================
// Client Invoice
// ============================

router.patch(
    "/invoice/:id/approve",
    approvalRemarksValidator,
    validate,
    controller.approveClientInvoice
);

router.patch(
    "/invoice/:id/reject",
    approvalRemarksValidator,
    validate,
    controller.rejectClientInvoice
);

router.patch(
    "/invoice/:id/share",
    approvalRemarksValidator,
    validate,
    controller.shareClientInvoice
);

router.patch(
    "/invoice/:id/paid",
    paymentValidator,
    validate,
    controller.markClientInvoicePaid
);


module.exports = router;