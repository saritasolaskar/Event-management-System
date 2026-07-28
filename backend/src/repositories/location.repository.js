const Location = require("../models/location.model");

/**
 * Create Location
 */
const create = async (locationData) => {
  return Location.create(locationData);
};

/**
 * Find Location By ID
 */
const findById = async (id) => {
  return Location.findOne({
    _id: id,
    isDeleted: false,
  });
};

/**
 * Find Location By Code
 */
const findByLocationCode = async (locationCode) => {
  return Location.findOne({
    locationCode,
    isDeleted: false,
  });
};

/**
 * Get All Locations
 */
const findAll = async (filter = {}) => {
  return Location.find({
    isDeleted: false,
    ...filter,
  }).sort({
    city: 1,
    name: 1,
  });
};

/**
 * Find Locations By City
 */
const findByCity = async (city) => {
  return Location.find({
    city,
    isDeleted: false,
  }).sort({
    name: 1,
  });
};

/**
 * Update Location
 */
const updateById = async (id, updateData) => {
  return Location.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );
};

/**
 * Soft Delete Location
 */
const softDelete = async (id) => {
  return Location.findByIdAndUpdate(
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
 * Update Location Status
 */
const updateStatus = async (id, status) => {
  return Location.findByIdAndUpdate(
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
  findByLocationCode,
  findAll,
  findByCity,
  updateById,
  softDelete,
  updateStatus,
};