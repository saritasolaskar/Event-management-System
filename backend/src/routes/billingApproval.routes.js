const express = require("express");

const router = express.Router();

const controller = require("../controllers/billingApproval.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const { ROLES } = require("../constants/roles");

router.use(
    protect,
    authorize(
        ROLES.ADMIN,
        ROLES.ACCOUNTS
    )
);

// Vendor Bill
router.patch("/vendor/:id/approve", controller.approveVendorBill);
router.patch("/vendor/:id/reject", controller.rejectVendorBill);
router.patch("/vendor/:id/share", controller.shareVendorBill);
router.patch("/vendor/:id/paid", controller.markVendorBillPaid);

// Client Invoice
router.patch("/invoice/:id/approve", controller.approveClientInvoice);
router.patch("/invoice/:id/reject", controller.rejectClientInvoice);
router.patch("/invoice/:id/share", controller.shareClientInvoice);
router.patch("/invoice/:id/paid", controller.markClientInvoicePaid);

module.exports = router;