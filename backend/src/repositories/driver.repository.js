const Driver = require("../models/driver.model");

/**
 * Create Driver
 */
const create = async (driverData) => {
  return Driver.create(driverData);
};

/**
 * Find Driver By ID
 */
const findById = async (id) => {
  return Driver.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("vendor", "companyName ownerName phone")
    .populate("currentVehicle", "vehicleNumber vehicleType");
};

/**
 * Find Driver By Phone
 */
const findByPhone = async (phone) => {
  return Driver.findOne({
    phone,
    isDeleted: false,
  });
};

/**
 * Find Driver By Email
 */
const findByEmail = async (email) => {
  return Driver.findOne({
    email,
    isDeleted: false,
  });
};

/**
 * Find Driver By License Number
 */
const findByLicenseNumber = async (licenseNumber) => {
  return Driver.findOne({
    licenseNumber,
    isDeleted: false,
  });
};

/**
 * Get All Drivers
 */
const findAll = async (filter = {}) => {
  return Driver.find({
    isDeleted: false,
    ...filter,
  })
    .populate("vendor", "companyName")
    .populate("currentVehicle", "vehicleNumber vehicleType")
    .sort({ createdAt: -1 });
};

/**
 * Update Driver
 */
const updateById = async (id, updateData) => {
  return Driver.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("vendor", "companyName")
    .populate("currentVehicle", "vehicleNumber vehicleType");
};

/**
 * Soft Delete Driver
 */
const softDelete = async (id) => {
  return Driver.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
    },
    {
      new: true,
    }
  );
};

/**
 * Update Driver Status
 */
const updateStatus = async (id, status) => {
  return Driver.findByIdAndUpdate(
    id,
    {
      status,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

module.exports = {
  create,
  findById,
  findByPhone,
  findByEmail,
  findByLicenseNumber,
  findAll,
  updateById,
  softDelete,
  updateStatus,
};