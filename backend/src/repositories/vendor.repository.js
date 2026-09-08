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
const findById = async (id) => {
    return Vendor.findOne({
        _id: id,
        isDeleted: false,
    });
};

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
    }).sort({
        createdAt: -1,
    });
};

module.exports = {
    create,
    findById,
    findByCompanyName,
    findByEmail,
    findByGST,
    findAll,
    
};