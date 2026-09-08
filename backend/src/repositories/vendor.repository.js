const Vendor = require("../models/vendor.model");

/**
 * Create Vendor
 */
const create = async (vendorData, session = null) => {
    const query = Vendor.create(
        [vendorData],
        session ? { session } : {}
    );

    const [vendor] = await query;

    return vendor;
};

/**
 * Find Vendor By ID
 */
const findById = async (id, session = null) => {
    const query = Vendor.findOne({
        _id: id,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Vendor By Company Name
 */
const findByCompanyName = async (
    companyName,
    session = null
) => {
    const query = Vendor.findOne({
        companyName,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Vendor By Email
 */
const findByEmail = async (
    email,
    session = null
) => {
    const query = Vendor.findOne({
        email,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Vendor By GST Number
 */
const findByGST = async (
    gstNumber,
    session = null
) => {
    const query = Vendor.findOne({
        gstNumber,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
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

/**
 * Update Vendor
 */
const updateById = async (
    id,
    updateData,
    session = null
) => {
    const query = Vendor.findOneAndUpdate(
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

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Soft Delete Vendor
 */
const softDelete = async (
    id,
    session = null
) => {
    const query = Vendor.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            isDeleted: true,
            deletedAt: new Date(),
        },
        {
            new: true,
            runValidators: true,
        }
    );

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Update Vendor Status
 */
const updateStatus = async (
    id,
    status,
    updatedBy = null,
    session = null
) => {
    const updateData = {
        status,
    };

    if (updatedBy) {
        updateData.updatedBy = updatedBy;
    }

    const query = Vendor.findOneAndUpdate(
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

    if (session) {
        query.session(session);
    }

    return query;
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