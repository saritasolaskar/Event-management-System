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
  return Client.findByIdAndUpdate(
    id,
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
const softDelete = async (id) => {
  return Client.findByIdAndUpdate(
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
 * Update Client Status
 */
const updateStatus = async (id, status) => {
  return Client.findByIdAndUpdate(
    id,
    { status },
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
  updateStatus,
};