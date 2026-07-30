const Duty = require("../models/duty.model");
const VehicleAssignment = require("../models/vehicleAssignment.model");

const {
    VEHICLE_ASSIGNMENT_STATUS,
} = require("../constants/status");

/**
 * Create Duty
 */
const create = async (data) => {
    return Duty.create(data);
};

/**
 * Get Duty By ID
 */
const findById = async (id) => {
    return Duty.findOne({
        _id: id,
        isDeleted: false,
    }).populate({
        path: "vehicleAssignment",
        populate: [
            {
                path: "event",
                populate: [
                    {
                        path: "client",
                    },
                    {
                        path: "venue",
                    },
                ],
            },
            {
                path: "driver",
            },
            {
                path: "vehicle",
            },
            {
                path: "vendor",
            },
        ],
    });
};

/**
 * Find Duty By Vehicle Assignment
 */
const findByVehicleAssignment = async (assignmentId) => {
    return Duty.findOne({
        vehicleAssignment: assignmentId,
        isDeleted: false,
    });
};

/**
 * Update Duty
 */
const updateById = async (id, data) => {
    return Duty.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
};

/**
 * Find Active Duty By Driver
 */
const findActiveDutyByDriver = async (driverId) => {
    const assignment = await VehicleAssignment.findOne({
        driver: driverId,
        status: VEHICLE_ASSIGNMENT_STATUS.ON_DUTY,
        isDeleted: false,
    });

    if (!assignment) {
        return null;
    }

    return Duty.findOne({
        vehicleAssignment: assignment._id,
        isDeleted: false,
    });
};

module.exports = {
    create,
    findById,
    findByVehicleAssignment,
    updateById,
    findActiveDutyByDriver,
};