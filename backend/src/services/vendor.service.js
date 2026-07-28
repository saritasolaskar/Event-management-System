const vendorRepository = require("../repositories/vendor.repository");

const AppError = require("../utils/appError");

/**
 * Create Vendor
 */
const createVendor = async (vendorData, userId) => {
  // Check if company name already exists
  const existingCompany = await vendorRepository.findByCompanyName(
    vendorData.companyName
  );

  if (existingCompany) {
    throw new AppError("Vendor company already exists.", 409);
  }

  // Check if email already exists
  const existingEmail = await vendorRepository.findByEmail(
    vendorData.email
  );

  if (existingEmail) {
    throw new AppError("Vendor email already exists.", 409);
  }

  // Check GST only if provided
  if (vendorData.gstNumber) {
    const existingGST = await vendorRepository.findByGST(
      vendorData.gstNumber
    );

    if (existingGST) {
      throw new AppError("Vendor GST already exists.", 409);
    }
  }

  // Audit Fields
  vendorData.createdBy = userId;
  vendorData.updatedBy = userId;

  return await vendorRepository.create(vendorData);
};

/**
 * Get All Vendors
 */
const getAllVendors = async () => {
  return await vendorRepository.findAll();
};

/**
 * Get Vendor By ID
 */
const getVendorById = async (vendorId) => {
  const vendor = await vendorRepository.findById(vendorId);

  if (!vendor) {
    throw new AppError("Vendor not found.", 404);
  }

  return vendor;
};

/**
 * Update Vendor
 */
const updateVendor = async (vendorId, updateData, userId) => {
  const vendor = await vendorRepository.findById(vendorId);

  if (!vendor) {
    throw new AppError("Vendor not found.", 404);
  }

  // Check company name uniqueness
  if (
    updateData.companyName &&
    updateData.companyName !== vendor.companyName
  ) {
    const existingCompany =
      await vendorRepository.findByCompanyName(
        updateData.companyName
      );

    if (existingCompany) {
      throw new AppError(
        "Vendor company already exists.",
        409
      );
    }
  }

  // Check email uniqueness
  if (
    updateData.email &&
    updateData.email !== vendor.email
  ) {
    const existingEmail =
      await vendorRepository.findByEmail(
        updateData.email
      );

    if (existingEmail) {
      throw new AppError(
        "Vendor email already exists.",
        409
      );
    }
  }

  // Check GST uniqueness
  if (
    updateData.gstNumber &&
    updateData.gstNumber !== vendor.gstNumber
  ) {
    const existingGST =
      await vendorRepository.findByGST(
        updateData.gstNumber
      );

    if (existingGST) {
      throw new AppError(
        "Vendor GST already exists.",
        409
      );
    }
  }

  updateData.updatedBy = userId;

  return await vendorRepository.updateById(
    vendorId,
    updateData
  );
};

/**
 * Delete Vendor
 */
const deleteVendor = async (vendorId) => {
  const vendor = await vendorRepository.findById(vendorId);

  if (!vendor) {
    throw new AppError("Vendor not found.", 404);
  }

  await vendorRepository.softDelete(vendorId);
};

/**
 * Update Vendor Status
 */
const updateVendorStatus = async (vendorId, status) => {
  const vendor = await vendorRepository.findById(vendorId);

  if (!vendor) {
    throw new AppError("Vendor not found.", 404);
  }

  return await vendorRepository.updateStatus(
    vendorId,
    status
  );
};

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
  updateVendorStatus,
};