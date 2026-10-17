
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
} = require("../validators/vendorBill.validator");

router.use(protect);
router.use(authorize(ROLES.ADMIN, ROLES.ACCOUNTS));

// List vendor bills for the billing dashboard.
router.get("/", controller.getVendorBills);

// Create a vendor bill for a completed duty.
router.post(
  "/:dutyId",
  createVendorBillValidator,
  validate,
  controller.createVendorBill
);

// Download a vendor bill PDF.
router.get(
  "/:id/pdf",
  vendorBillIdValidator,
  validate,
  controller.downloadVendorBillPdf
);

module.exports = router;
