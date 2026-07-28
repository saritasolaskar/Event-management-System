const Vehicle = require("../models/vehicle.model");

/**
 * Create Vehicle
 */
const create = async (vehicleData) => {
  return Vehicle.create(vehicleData);
};

/**
 * Find Vehicle By ID
 */
const findById = async (id) => {
  return Vehicle.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("vendor", "companyName ownerName phone")
    .populate("currentDriver", "firstName lastName phone");
};

/**
 * Find Vehicle By Number
 */
const findByVehicleNumber = async (vehicleNumber) => {
  return Vehicle.findOne({
    vehicleNumber,
    isDeleted: false,
  });
};

/**
 * Get All Vehicles
 */
const findAll = async (filter = {}) => {
  return Vehicle.find({
    isDeleted: false,
    ...filter,
  })
    .populate("vendor", "companyName")
    .populate("currentDriver", "firstName lastName phone")
    .sort({ createdAt: -1 });
};

/**
 * Update Vehicle
 */
const updateById = async (id, updateData) => {
  return Vehicle.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("vendor", "companyName")
    .populate("currentDriver", "firstName lastName phone");
};

/**
 * Soft Delete Vehicle
 */
const softDelete = async (id) => {
  return Vehicle.findByIdAndUpdate(
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
 * Update Vehicle Status
 */
const updateStatus = async (id, status) => {
  return Vehicle.findByIdAndUpdate(
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

/**
 * Find Vehicle By Driver
 */
const findByCurrentDriver = async (driverId) => {
  return Vehicle.findOne({
    currentDriver: driverId,
    isDeleted: false,
  });
};

module.exports = {
  create,
  findById,
  findByVehicleNumber,
  findAll,
  updateById,
  softDelete,
  updateStatus,
  findByCurrentDriver,
};