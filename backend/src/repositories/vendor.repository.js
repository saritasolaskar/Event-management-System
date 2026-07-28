const Vendor = require("../models/vendor.model");

/**
 * Create Vendor
 */
const create = async (vendorData) => {
  return Vendor.create(vendorData);
};

/**
 * Find Vendor By ID
 */
const findById = (id) =>
    VendorBill.findById(id)

        .populate("vendor")

        .populate({
            path: "vehicleAssignment",
            populate: [
                {
                    path: "driver",
                },
                {
                    path: "vehicle",
                },
            ],
        })

        .populate({
            path: "duty",
            populate: {
                path: "event",
                populate: {
                    path: "venue",
                },
            },
        })

        .populate("approvedBy");

/**
 * Find Vendor By Company Name
 */
const findByCompanyName = async (companyName) => {
  return Vendor.findOne({
    companyName,
    isDeleted: false,
  });
};

/**
 * Find Vendor By Email
 */
const findByEmail = async (email) => {
  return Vendor.findOne({
    email,
    isDeleted: false,
  });
};

/**
 * Find Vendor By GST Number
 */
const findByGST = async (gstNumber) => {
  return Vendor.findOne({
    gstNumber,
    isDeleted: false,
  });
};

/**
 * Get All Vendors
 */
const findAll = async (filter = {}) => {
  return Vendor.find({
    isDeleted: false,
    ...filter,
  }).sort({ createdAt: -1 });
};

/**
 * Update Vendor
 */
const updateById = async (id, updateData) => {
  return Vendor.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );
};

/**
 * Soft Delete Vendor
 */
const softDelete = async (id) => {
  return Vendor.findByIdAndUpdate(
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
 * Update Vendor Status
 */
const updateStatus = async (id, status) => {
  return Vendor.findByIdAndUpdate(
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
  findByCompanyName,
  findByEmail,
  findByGST,
  findAll,
  updateById,
  softDelete,
  updateStatus,
};