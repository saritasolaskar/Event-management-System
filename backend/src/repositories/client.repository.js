const Client = require("../models/client.model");

/**
 * Create Client
 */
const create = async (clientData) => {
  return Client.create(clientData);
};

/**
 * Find Client By ID
 */
const findById = async (id) => {
  return Client.findOne({
    _id: id,
    isDeleted: false,
  });
};

/**
 * Find Client By Company Name
 */
const findByCompanyName = async (companyName) => {
  return Client.findOne({
    companyName,
    isDeleted: false,
  });
};

/**
 * Find Client By Email
 */
const findByEmail = async (email) => {
  return Client.findOne({
    email,
    isDeleted: false,
  });
};

/**
 * Find Client By GST Number
 */
const findByGST = async (gstNumber) => {
  return Client.findOne({
    gstNumber,
    isDeleted: false,
  });
};

/**
 * Get All Clients
 */
const findAll = async (filter = {}) => {
  return Client.find({
    isDeleted: false,
    ...filter,
  }).sort({ createdAt: -1 });
};

/**
 * Update Client
 */
const updateById = async (id, updateData) => {
  return Client.findOneAndUpdate(
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
 * Soft Delete Client
 */
const softDelete = async (id, userId) => {
  return Client.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
    },
    {
      isDeleted: true,
      deletedAt: new Date(),
      updatedBy: userId,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

/**
 * Atomically update Client Status
 *
 * The status is updated only if the client's current status
 * still matches the status that was originally read.
 */
const updateStatusIfCurrent = async (
  id,
  currentStatus,
  status,
  userId
) => {
  return Client.findOneAndUpdate(
    {
      _id: id,
      isDeleted: false,
      status: currentStatus,
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
  findByCompanyName,
  findByEmail,
  findByGST,
  findAll,
  updateById,
  softDelete,
  updateStatusIfCurrent,
};