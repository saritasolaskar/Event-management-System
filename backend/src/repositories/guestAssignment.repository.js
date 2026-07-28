const GuestAssignment = require("../models/guestAssignment.model");

const create = async (data) => {
    return GuestAssignment.create(data);
};

const findById = async (id) => {
    return GuestAssignment.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate("guest")
        .populate({
    path: "vehicleAssignment",
    populate: [
        {
            path: "driver",
            select: "firstName lastName phone",
        },
        {
            path: "vehicle",
            select: "vehicleNumber vehicleType",
        },
        {
            path: "vendor",
            select: "vendorName",
        },
        {
            path: "event",
            select: "eventName eventCode",
        },
    ],
});
};

const findAll = async () => {
    return GuestAssignment.find({
        isDeleted: false,
    })
        .populate("guest")
        .populate({
            path: "vehicleAssignment",
            populate: [
                { path: "driver" },
                { path: "vehicle" },
                { path: "event" },
            ],
        })
        .sort({ createdAt: -1 });
};





const updateById = async (id, data) => {
    return GuestAssignment.findByIdAndUpdate(
        id,
        data,
        {
            new: true,
            runValidators: true,
        }
    );
};

const softDelete = async (id) => {
    return GuestAssignment.findByIdAndUpdate(
        id,
        {
            isDeleted: true,
        },
        {
            new: true,
        }
    );
};
const findByEvent = async (eventId) => {

    const assignments = await GuestAssignment.find({
        isDeleted: false,
    })
    .populate("guest")
    .populate({
        path: "vehicleAssignment",
        match: {
            event: eventId,
            isDeleted: false,
        },
        populate: [
            {
                path: "driver",
                select: "firstName lastName phone",
            },
            {
                path: "vehicle",
                select: "vehicleNumber vehicleType",
            },
            {
                path: "vendor",
                select: "vendorName contactPerson phone",
            },
            {
                path: "event",
                select: "eventName eventCode",
            },
        ],
    });

    return assignments.filter(
        assignment => assignment.vehicleAssignment
    );

};

const findByGuest = async (guestId) => {

    return GuestAssignment.findOne({
        guest: guestId,
        isDeleted: false,
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

};

const findByVehicleAssignment = async (vehicleAssignmentId) => {

    return GuestAssignment.find({
        vehicleAssignment: vehicleAssignmentId,
        isDeleted: false,
    })
    .populate("guest");

};

const findByDriver = async (driverId) => {

    return GuestAssignment.find({
        isDeleted: false,
    })
    .populate({
        path: "vehicleAssignment",
        match: {
            driver: driverId,
            isDeleted: false,
        },
        populate: [
            {
                path: "vehicle",
            },
            {
                path: "event",
            },
        ],
    })
    .populate("guest");

};

module.exports = {
    create,
    findById,
    findAll,
    updateById,
    softDelete,
    findByEvent,
    findByVehicleAssignment,
    findByGuest,
    findByDriver,
};