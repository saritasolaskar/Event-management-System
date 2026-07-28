const vendorService = require("../services/vendor.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

/**
 * Create Vendor
 */
const createVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.createVendor(
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    201,
    "Vendor created successfully.",
    vendor
  );
});

/**
 * Get All Vendors
 */
const getAllVendors = asyncHandler(async (req, res) => {
  const vendors = await vendorService.getAllVendors();

  return successResponse(
    res,
    200,
    "Vendors fetched successfully.",
    vendors
  );
});

/**
 * Get Vendor By ID
 */
const getVendorById = asyncHandler(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);

  return successResponse(
    res,
    200,
    "Vendor fetched successfully.",
    vendor
  );
});

/**
 * Update Vendor
 */
const updateVendor = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendor(
    req.params.id,
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Vendor updated successfully.",
    vendor
  );
});

/**
 * Delete Vendor
 */
const deleteVendor = asyncHandler(async (req, res) => {
  await vendorService.deleteVendor(req.params.id);

  return successResponse(
    res,
    200,
    "Vendor deleted successfully."
  );
});

/**
 * Update Vendor Status
 */
const updateVendorStatus = asyncHandler(async (req, res) => {
  const vendor = await vendorService.updateVendorStatus(
    req.params.id,
    req.body.status
  );

  return successResponse(
    res,
    200,
    "Vendor status updated successfully.",
    vendor
  );
});

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
};