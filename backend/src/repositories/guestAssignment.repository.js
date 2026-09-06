const GuestAssignment = require("../models/guestAssignment.model");
const VehicleAssignment = require("../models/vehicleAssignment.model");

/**
 * Create Guest Assignment
 */
const create = async (data) => {
    return GuestAssignment.create(data);
};

/**
 * Find Guest Assignment By ID
 */
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
                    select: "companyName",
                },
                {
                    path: "event",
                    select: "name eventCode",
                },
            ],
        });
};

/**
 * Get All Guest Assignments
 */
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
                { path: "vendor" },
                { path: "event" },
            ],
        })
        .sort({ createdAt: -1 });
};

/**
 * Update Guest Assignment
 */
const updateById = async (id, data) => {
    return GuestAssignment.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true,
    });
};

/**
 * Soft Delete Guest Assignment
 */
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

/**
 * Find Guest Assignments By Event
 */
const findByEvent = async (eventId) => {
    const vehicleAssignments = await VehicleAssignment.find({
        event: eventId,
        isDeleted: false,
    }).select("_id");

    const assignmentIds = vehicleAssignments.map(
        (assignment) => assignment._id
    );

    return GuestAssignment.find({
        vehicleAssignment: {
            $in: assignmentIds,
        },
        isDeleted: false,
    })
        .populate("guest")
        .populate({
            path: "vehicleAssignment",
            populate: [
                {
                    path: "vehicle",
                },
                {
                    path: "driver",
                },
                {
                    path: "event",
                },
            ],
        });
};

/**
 * Find Guest Assignment By Guest
 */
const findByGuest = async (guestId) => {
    return GuestAssignment.findOne({
        guest: guestId,
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

/**
 * Find Guest Assignments By Vehicle Assignment
 */
const findByVehicleAssignment = async (vehicleAssignmentId) => {
    return GuestAssignment.find({
        vehicleAssignment: vehicleAssignmentId,
        isDeleted: false,
    })
        .populate("guest")
        .sort({
            pickupSequence: 1,
            dropSequence: 1,
        });
};
/**
 * Find Guest Assignments By Driver
 */
const findByDriver = async (driverId) => {
    const assignments = await GuestAssignment.find({
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
                {
                    path: "vendor",
                },
            ],
        })
        .populate("guest");

    // Remove records where vehicleAssignment didn't match
    return assignments.filter(
        (assignment) => assignment.vehicleAssignment
    );
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