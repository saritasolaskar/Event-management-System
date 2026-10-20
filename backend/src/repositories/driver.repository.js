
const Driver = require("../models/driver.model");

const normalizePhoneDigits = (phone) =>
    String(phone ?? "").replace(/\D/g, "");

const escapeRegex = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Create Driver
 */
const create = async (driverData, session = null) => {
    const [driver] = await Driver.create(
        [driverData],
        session ? { session } : {}
    );

    return driver;
};

/**
 * Find Driver By ID
 */
const findById = async (id, session = null) => {
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
 * Find Driver By Phone.
 *
 * Supports phone numbers entered with spaces, hyphens,
 * country codes, or other formatting differences.
 */
const findByPhone = async (phone, session = null) => {
    const originalPhone = String(phone ?? "").trim();

    if (!originalPhone) {
        return null;
    }

    const exactQuery = Driver.findOne({
        phone: originalPhone,
        isDeleted: false,
    });

    if (session) {
        exactQuery.session(session);
    }

    const exactMatch = await exactQuery;

    if (exactMatch) {
        return exactMatch;
    }

    const digits = normalizePhoneDigits(originalPhone);

    if (digits.length < 10) {
        return null;
    }

    // Indian mobile numbers may be stored with a country
    // code or a leading zero. Match the final 10 digits.
    const lastTenDigits = digits.slice(-10);

    if (!/^[6-9]\d{9}$/.test(lastTenDigits)) {
        return null;
    }

    // Allow separators between digits and an optional
    // Indian country code or leading zero.
    const digitPattern = lastTenDigits
        .split("")
        .map(escapeRegex)
        .join("\\D*");

    const phonePattern =
        `^(?:(?:\\+?91|0)\\D*)?${digitPattern}$`;

    const formattedQuery = Driver.findOne({
        phone: {
            $regex: phonePattern,
        },
        isDeleted: false,
    });

    if (session) {
        formattedQuery.session(session);
    }

    return formattedQuery;
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
    updatedBy = null,
    session = null
) => {
    const updateData = {
        isDeleted: true,
        ...(updatedBy && {
            updatedBy,
        }),
    };

    const query = Driver.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        updateData,
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
    updatedBy = null,
    session = null
) => {
    const updateData = {
        status,
        ...(updatedBy && {
            updatedBy,
        }),
    };

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
