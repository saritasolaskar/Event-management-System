
const Vehicle = require("../models/vehicle.model");

const normalizeVehicleNumber = (vehicleNumber) =>
    String(vehicleNumber || "")
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();

/**
 * Create Vehicle
 */
const create = async (vehicleData, session = null) => {
    const normalizedData = {
        ...vehicleData,
        vehicleNumber: normalizeVehicleNumber(
            vehicleData.vehicleNumber
        ),
    };

    const [vehicle] = await Vehicle.create(
        [normalizedData],
        session ? { session } : {}
    );

    return vehicle;
};

/**
 * Find Vehicle By ID
 */
const findById = async (id, session = null) => {
    const query = Vehicle.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate("vendor", "companyName ownerName phone")
        .populate("currentDriver", "firstName lastName phone");

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Vehicle By Registration Number.
 * Always normalize the registration number before lookup.
 */
const findByVehicleNumber = async (
    vehicleNumber,
    session = null
) => {
    const normalizedNumber =
        normalizeVehicleNumber(vehicleNumber);

    if (!normalizedNumber) {
        return null;
    }

    const query = Vehicle.findOne({
        vehicleNumber: normalizedNumber,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
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
        .sort({
            createdAt: -1,
        });
};

/**
 * Update Vehicle
 */
const updateById = async (
    id,
    updateData,
    session = null
) => {
    const normalizedData = { ...updateData };

    if (
        Object.prototype.hasOwnProperty.call(
            normalizedData,
            "vehicleNumber"
        )
    ) {
        normalizedData.vehicleNumber =
            normalizeVehicleNumber(
                normalizedData.vehicleNumber
            );
    }

    const query = Vehicle.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        normalizedData,
        {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        }
    )
        .populate("vendor", "companyName")
        .populate("currentDriver", "firstName lastName phone");

    return query;
};

/**
 * Soft Delete Vehicle
 */
const softDelete = async (
    id,
    session = null
) => {
    const query = Vehicle.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            isDeleted: true,
        },
        {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        }
    );

    return query;
};

/**
 * Update Vehicle Status
 */
const updateStatus = async (
    id,
    status,
    updatedBy,
    session = null
) => {
    const query = Vehicle.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            status,
            updatedBy,
        },
        {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        }
    )
        .populate("vendor", "companyName")
        .populate("currentDriver", "firstName lastName phone");

    return query;
};

/**
 * Find Vehicle By Driver
 */
const findByCurrentDriver = async (
    driverId,
    session = null
) => {
    const query = Vehicle.findOne({
        currentDriver: driverId,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Vehicles By Vendor
 */
const findByVendor = async (
    vendorId,
    session = null
) => {
    const query = Vehicle.find({
        vendor: vendorId,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Register an existing vehicle for an event.
 * $addToSet prevents the same event ID being added twice.
 */
const addEventUsage = async (
    vehicleId,
    eventId,
    session = null
) => {
    const query = Vehicle.findOneAndUpdate(
        {
            _id: vehicleId,
            isDeleted: false,
        },
        {
            $addToSet: {
                eventsUsedFor: eventId,
            },
        },
        {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        }
    );

    return query;
};

/**
 * Find Vehicles Registered For An Event
 */
const findByEvent = async (
    eventId,
    session = null
) => {
    const query = Vehicle.find({
        eventsUsedFor: eventId,
        isDeleted: false,
    })
        .populate("vendor", "companyName")
        .populate(
            "currentDriver",
            "firstName lastName phone"
        )
        .sort({
            vehicleNumber: 1,
        });

    if (session) {
        query.session(session);
    }

    return query;
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
    findByVendor,
    addEventUsage,
    findByEvent,
};
