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
 * Count active locations by filter
 */
const count = async (filter = {}) => {
  return Location.countDocuments({
    isDeleted: false,
    ...filter,
  });
};

/**
 * Update Location
 */
const updateById = async (id, updateData) => {
  return Location.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
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
const softDelete = async (id, userId) => {
  return Location.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    {
      isDeleted: true,
      updatedBy: userId,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

/**
 * Update Location Status
 */
const updateStatus = async (id, status, userId) => {
  return Location.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    {
      status,
      updatedBy: userId,
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
  count,
  updateById,
  softDelete,
  updateStatus,
};