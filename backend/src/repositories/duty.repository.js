const Duty = require("../models/duty.model");
const VehicleAssignment = require("../models/vehicleAssignment.model");

const create = (data) => {
    return Duty.create(data);
};

const findById = (id) => {
    return Duty.findOne({
        _id: id,
        isDeleted: false,
    }).populate({
        path: "vehicleAssignment",
        populate: [
            {
                path: "driver",
            },
            {
                path: "vehicle",
            },
            {
                path: "vendor",
            },
            {
                path: "event",
            },
        ],
    });
};

const findByVehicleAssignment = (assignmentId) => {
    return Duty.findOne({
        vehicleAssignment: assignmentId,
        isDeleted: false,
    });
};

const updateById = (id, data) => {
    return Duty.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        data,
        {
            new: true,
            runValidators: true,
        }
    );
};

const findActiveDutyByDriver = async (driverId) => {
    const activeAssignment = await VehicleAssignment.findOne({
        driver: driverId,
        isDeleted: false,
        status: "ON_DUTY",
    });

    if (!activeAssignment) {
        return null;
    }

    return Duty.findOne({
        vehicleAssignment: activeAssignment._id,
        status: "STARTED",
        isDeleted: false,
    }).populate({
        path: "vehicleAssignment",
        populate: [
            {
                path: "driver",
            },
            {
                path: "vehicle",
            },
            {
                path: "vendor",
            },
            {
                path: "event",
            },
        ],
    });
};

module.exports = {
    create,
    findById,
    findByVehicleAssignment,
    updateById,
    findActiveDutyByDriver,
};