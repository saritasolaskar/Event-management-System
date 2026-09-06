const driverRepository = require("../repositories/driver.repository");
const vendorRepository = require("../repositories/vendor.repository");

const AppError = require("../utils/AppError");

/**
 * Create Driver
 */
const createDriver = async (driverData, userId) => {
  // Check Vendor Exists
  const vendor = await vendorRepository.findById(driverData.vendor);

  if (!vendor) {
    throw new AppError("Vendor not found.", 404);
  }

  // Check Phone Number
  const existingPhone = await driverRepository.findByPhone(
    driverData.phone
  );

  if (existingPhone) {
    throw new AppError("Phone number already exists.", 409);
  }

  // Check Email
  if (driverData.email) {
    const existingEmail = await driverRepository.findByEmail(
      driverData.email
    );

    if (existingEmail) {
      throw new AppError("Email already exists.", 409);
    }
  }

  // Check License Number
  const existingLicense =
    await driverRepository.findByLicenseNumber(
      driverData.licenseNumber
    );

  if (existingLicense) {
    throw new AppError("License number already exists.", 409);
  }

  // Audit Fields
  driverData.createdBy = userId;
  driverData.updatedBy = userId;

  return await driverRepository.create(driverData);
};

/**
 * Get All Drivers
 */
const getAllDrivers = async () => {
  return await driverRepository.findAll();
};

/**
 * Get Driver By ID
 */
const getDriverById = async (driverId) => {
  const driver = await driverRepository.findById(driverId);

  if (!driver) {
    throw new AppError("Driver not found.", 404);
  }

  return driver;
};

/**
 * Update Driver
 */
const updateDriver = async (
  driverId,
  updateData,
  userId
) => {
  const driver = await driverRepository.findById(driverId);

  if (!driver) {
    throw new AppError("Driver not found.", 404);
  }

  // Vendor Validation
  if (updateData.vendor) {
    const vendor = await vendorRepository.findById(
      updateData.vendor
    );

    if (!vendor) {
      throw new AppError("Vendor not found.", 404);
    }
  }

  // Phone Validation
  if (
    updateData.phone &&
    updateData.phone !== driver.phone
  ) {
    const existingPhone =
      await driverRepository.findByPhone(
        updateData.phone
      );

    if (existingPhone) {
      throw new AppError(
        "Phone number already exists.",
        409
      );
    }
  }

  // Email Validation
  if (
    updateData.email &&
    updateData.email !== driver.email
  ) {
    const existingEmail =
      await driverRepository.findByEmail(
        updateData.email
      );

    if (existingEmail) {
      throw new AppError(
        "Email already exists.",
        409
      );
    }
  }

  // License Validation
  if (
    updateData.licenseNumber &&
    updateData.licenseNumber !==
      driver.licenseNumber
  ) {
    const existingLicense =
      await driverRepository.findByLicenseNumber(
        updateData.licenseNumber
      );

    if (existingLicense) {
      throw new AppError(
        "License number already exists.",
        409
      );
    }
  }

  updateData.updatedBy = userId;

  return await driverRepository.updateById(
    driverId,
    updateData
  );
};

/**
 * Delete Driver
 */
const deleteDriver = async (driverId) => {
  const driver = await driverRepository.findById(driverId);

  if (!driver) {
    throw new AppError("Driver not found.", 404);
  }

  await driverRepository.softDelete(driverId);
};

/**
 * Update Driver Status
 */
const updateDriverStatus = async (
  driverId,
  status
) => {
  const driver = await driverRepository.findById(driverId);

  if (!driver) {
    throw new AppError("Driver not found.", 404);
  }

  return await driverRepository.updateStatus(
    driverId,
    status
  );
};

module.exports = {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
};