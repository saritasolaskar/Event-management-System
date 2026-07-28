const express = require("express");

const vendorController = require("../controllers/vendor.controller");

const validate = require("../middleware/validate");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");

const { ROLES } = require("../constants/roles");

const {
  createVendorValidator,
  updateVendorValidator,
  vendorIdValidator,
} = require("../validators/vendor.validator");

const router = express.Router();

/**
 * Create Vendor
 */
router.post(
  "/",
  protect,
  authorize(ROLES.ADMIN),
  createVendorValidator,
  validate,
  vendorController.createVendor
);

/**
 * Get All Vendors
 */
router.get(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  vendorController.getAllVendors
);

/**
 * Get Vendor By ID
 */
router.get(
  "/:id",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  vendorIdValidator,
  validate,
  vendorController.getVendorById
);

/**
 * Update Vendor
 */
router.put(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  updateVendorValidator,
  validate,
  vendorController.updateVendor
);

/**
 * Delete Vendor
 */
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  vendorIdValidator,
  validate,
  vendorController.deleteVendor
);

/**
 * Update Vendor Status
 */
router.patch(
  "/:id/status",
  protect,
  authorize(ROLES.ADMIN),
  vendorIdValidator,
  validate,
  vendorController.updateVendorStatus
);

module.exports = router;