const Duty = require("../models/duty.model");

const create = (data) => {

    return Duty.create(data);

};

const findById = (id) =>
    Duty.findById(id)

        .populate({
            path: "event",
            populate: [
                {
                    path: "client",
                },
                {
                    path: "venue",
                },
            ],
        })

        .populate({
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
            ],
        });

const findByVehicleAssignment = (assignmentId) => {

    return Duty.findOne({
        vehicleAssignment: assignmentId,
        isDeleted: false,
    });

};

const updateById = (id, data) => {

    return Duty.findByIdAndUpdate(
        id,
        data,
        {
            new: true,
            runValidators: true,
        }
    );

};

const findActiveDutyByDriver = async (driverId) => {

    return Duty.findOne({
        driver: driverId,
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