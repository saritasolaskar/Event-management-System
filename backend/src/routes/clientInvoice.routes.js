
const express = require("express");

const router = express.Router();

const controller =
  require("../controllers/clientInvoice.controller");

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");
const { ROLES } = require("../constants/roles");

const {
  createClientInvoiceValidator,
  clientInvoiceIdValidator,
} = require("../validators/clientInvoice.validator");

// Admin/accounts listing and creation routes.
router.get(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.ACCOUNTS),
  controller.getClientInvoices
);

router.post(
  "/:dutyId",
  protect,
  authorize(ROLES.ADMIN, ROLES.ACCOUNTS),
  createClientInvoiceValidator,
  validate,
  controller.createClientInvoice
);

// PDF download remains available to authorized clients too.
// Client ownership must be checked by the PDF service.
router.get(
  "/:invoiceId/pdf",
  protect,
  authorize(ROLES.ADMIN, ROLES.ACCOUNTS, ROLES.CLIENT),
  clientInvoiceIdValidator,
  validate,
  controller.downloadInvoicePdf
);

module.exports = router;
