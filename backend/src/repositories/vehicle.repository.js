const Vehicle = require("../models/vehicle.model");

/**
 * Create Vehicle
 */
const create = async (vehicleData, session = null) => {
    const [vehicle] = await Vehicle.create(
        [vehicleData],
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
 * Find Vehicle By Number
 */
const findByVehicleNumber = async (
    vehicleNumber,
    session = null
) => {
    const query = Vehicle.findOne({
        vehicleNumber,
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
    const query = Vehicle.findOneAndUpdate(
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
        .populate("vendor", "companyName")
        .populate("currentDriver", "firstName lastName phone");

    if (session) {
        query.session(session);
    }

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
        }
    );

    if (session) {
        query.session(session);
    }

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
        }
    )
        .populate("vendor", "companyName")
        .populate("currentDriver", "firstName lastName phone");

    if (session) {
        query.session(session);
    }

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

module.exports = {
    create,
    findById,
    findByVehicleNumber,
    findAll,
    updateById,
    softDelete,
    updateStatus,
    findByCurrentDriver,
};