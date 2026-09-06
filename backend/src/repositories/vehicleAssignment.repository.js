const VehicleAssignment = require("../models/vehicleAssignment.model");

const create = async (data) => {
    return VehicleAssignment.create(data);
};

const findById = async (id) => {
    return VehicleAssignment.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate("event")
        .populate("vendor")
        .populate("driver")
        .populate("vehicle")
        .populate("reportingLocation");
};

const findAll = async () => {
    return VehicleAssignment.find({
        isDeleted: false,
    })
        .populate("event", "eventCode name")
        .populate("vendor", "vendorCode companyName")
        .populate("driver", "firstName lastName phone")
        .populate("vehicle", "registrationNumber vehicleType")
        .sort({
            createdAt: -1,
        });
};

const updateById = async (id, data) => {
    return VehicleAssignment.findByIdAndUpdate(
        id,
        data,
        {
            new: true,
            runValidators: true,
        }
    );
};

const softDelete = async (id) => {
    return VehicleAssignment.findByIdAndUpdate(
        id,
        {
            isDeleted: true,
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

const findTodayByDriver = async (driverId) => {
    return VehicleAssignment.findOne({
        driver: driverId,
        isDeleted: false,
    })
        .populate("vehicle")
        .populate("event")
        .populate("vendor");
};

const findByEvent = async (eventId) => {
    return VehicleAssignment.find({
        event: eventId,
        isDeleted: false,
    })
        .populate("driver")
        .populate("vehicle")
        .populate("vendor")
        .sort({
            createdAt: 1,
        });
};

/**
 * Find active assignment for a driver.
 * Excludes current assignment during update.
 */
const findActiveByDriver = async (
    driverId,
    excludeAssignmentId = null
) => {

    const query = {
        driver: driverId,
        isDeleted: false,
        status: {
            $in: ["ASSIGNED", "ON_DUTY"],
        },
    };

    if (excludeAssignmentId) {
        query._id = {
            $ne: excludeAssignmentId,
        };
    }

    return VehicleAssignment.findOne(query);

};

/**
 * Find active assignment for a vehicle.
 * Excludes current assignment during update.
 */
const findActiveByVehicle = async (
    vehicleId,
    excludeAssignmentId = null
) => {

    const query = {
        vehicle: vehicleId,
        isDeleted: false,
        status: {
            $in: ["ASSIGNED", "ON_DUTY"],
        },
    };

    if (excludeAssignmentId) {
        query._id = {
            $ne: excludeAssignmentId,
        };
    }

    return VehicleAssignment.findOne(query);

};
module.exports = {
    create,
    findById,
    findAll,
    updateById,
    softDelete,
    findTodayByDriver,
    findByEvent,
    findActiveByDriver,
    findActiveByVehicle,
};