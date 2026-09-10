const Driver = require("../models/driver.model");

/**
 * Create Driver
 */
const create = async (
    driverData,
    session = null
) => {
    const [driver] = await Driver.create(
        [driverData],
        session ? { session } : {}
    );

    return driver;
};

/**
 * Find Driver By ID
 */
const findById = async (
    id,
    session = null
) => {
    const query = Driver.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate(
            "vendor",
            "companyName ownerName phone"
        )
        .populate(
            "currentVehicle",
            "vehicleNumber vehicleType"
        );

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Driver By Phone
 */
const findByPhone = async (
    phone,
    session = null
) => {
    const query = Driver.findOne({
        phone,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Driver By Email
 */
const findByEmail = async (
    email,
    session = null
) => {
    const query = Driver.findOne({
        email,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Driver By License Number
 */
const findByLicenseNumber = async (
    licenseNumber,
    session = null
) => {
    const query = Driver.findOne({
        licenseNumber,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
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
        .populate(
            "currentVehicle",
            "vehicleNumber vehicleType"
        )
        .sort({
            createdAt: -1,
        });
};

/**
 * Update Driver
 */
const updateById = async (
    id,
    updateData,
    session = null
) => {
    const query = Driver.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        updateData,
        {
            new: true,
            runValidators: true,
        }
    )
        .populate(
            "vendor",
            "companyName ownerName phone"
        )
        .populate(
            "currentVehicle",
            "vehicleNumber vehicleType"
        );

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Soft Delete Driver
 */
const softDelete = async (
    id,
    session = null
) => {
    const query = Driver.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            isDeleted: true,
        },
        {
            new: true,
        }
    );

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Update Driver Status
 */
const updateStatus = async (
    id,
    status,
    session = null
) => {
    const query = Driver.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            status,
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
 * Find Drivers By Vendor
 */
const findByVendor = async (
    vendorId,
    session = null
) => {
    const query = Driver.find({
        vendor: vendorId,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
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
    findByVendor,
};