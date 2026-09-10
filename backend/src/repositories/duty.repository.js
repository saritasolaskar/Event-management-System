const Duty = require("../models/duty.model");
const VehicleAssignment = require("../models/vehicleAssignment.model");



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

const create = (
    data,
    session = null
) => {
    return Duty.create(
        [data],
        session
            ? { session }
            : undefined
    ).then((docs) => docs[0]);
};

const updateById = (
    id,
    data,
    session = null
) => {
    return Duty.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        data,
        {
            new: true,
            runValidators: true,
            ...(session
                ? { session }
                : {}),
        }
    );
};

const updateByIdAndStatus = (
    id,
    currentStatus,
    data,
    session = null
) => {
    return Duty.findOneAndUpdate(
        {
            _id: id,
            status: currentStatus,
            isDeleted: false,
        },
        data,
        {
            new: true,
            runValidators: true,
            ...(session
                ? { session }
                : {}),
        }
    );
};

module.exports = {
    create,
    findById,
    findByVehicleAssignment,
    updateById,
    findActiveDutyByDriver,
    updateByIdAndStatus,
};