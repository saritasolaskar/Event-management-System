
const GuestAssignment = require("../models/guestAssignment.model");
const mongoose = require("mongoose");
const VehicleAssignment = require("../models/vehicleAssignment.model");

/**
 * Populate guest details, including pickup and drop locations.
 * Required by the duty-sheet PDF generator.
 */
const guestDetailsPopulate = {
    path: "guest",
    populate: [
        { path: "pickupLocation" },
        { path: "dropLocation" },
    ],
};

/**
 * Create Guest Assignment
 */
const create = (data, session = null) => {
    return GuestAssignment.create(
        [data],
        session ? { session } : undefined
    ).then((docs) => docs[0]);
};

/**
 * Find Guest Assignment By ID
 */
const findById = async (id) => {
    return GuestAssignment.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate(guestDetailsPopulate)
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
        .populate(guestDetailsPopulate)
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
    return GuestAssignment.findOneAndUpdate(
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


const updateByIdIfState = async (
    id,
    expectedState,
    data,
    session = null
) => {
    return GuestAssignment.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
            ...expectedState,
        },
        data,
        {
            new: true,
            runValidators: true,
            ...(session ? { session } : {}),
        }
    );
};


const updateByIdIfPending = async (
    id,
    data,
    session = null
) => {
    return updateByIdIfState(
        id,
        {
            pickupStatus: "PENDING",
            returnStatus: "NOT_STARTED",
        },
        data,
        session
    );
};


const softDeleteIfPending = async (
    id,
    session = null
) => {
    return GuestAssignment.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
            pickupStatus: "PENDING",
            returnStatus: "NOT_STARTED",
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
};


/**
 * Soft Delete only if trip has not started.
 */

const softDeleteIfPending = async (
    id,
    session = null
) => {
    return GuestAssignment.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
            pickupStatus: "PENDING",
            returnStatus: "NOT_STARTED",
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
        .populate(guestDetailsPopulate)
        .populate({
            path: "vehicleAssignment",
            populate: [
                { path: "vehicle" },
                { path: "driver" },
                { path: "event" },
            ],
        })
        .sort({
            pickupSequence: 1,
            dropSequence: 1,
        });
};

/**
 * Find active Guest Assignment By Guest.
 * Historical assignments belonging to COMPLETED/CANCELLED
 * vehicle assignments are intentionally ignored.
 */

const findActiveByGuest = async (
    guestId,
    session = null
) => {
    const aggregate = GuestAssignment.aggregate([
        {
            $match: {
                guest: new mongoose.Types.ObjectId(
                    guestId
                ),
                isDeleted: false,
            },
        },
        {
            $lookup: {
                from: "vehicleassignments",
                localField: "vehicleAssignment",
                foreignField: "_id",
                as: "vehicleAssignment",
            },
        },
        {
            $unwind: "$vehicleAssignment",
        },
        {
            $match: {
                "vehicleAssignment.isDeleted": false,
                "vehicleAssignment.status": {
                    $in: ["ASSIGNED", "ON_DUTY"],
                },
            },
        },
        {
            $limit: 1,
        },
    ]);

    if (session) {
        aggregate.session(session);
    }

    const assignments = await aggregate;
    return assignments[0] || null;
};


/**
 * Find Guest Assignment By Guest
 */
const findByGuest = async (guestId) => {
    return GuestAssignment.findOne({
        guest: guestId,
        isDeleted: false,
    })
        .populate(guestDetailsPopulate)
        .populate({
            path: "vehicleAssignment",
            populate: [
                { path: "driver" },
                { path: "vehicle" },
                { path: "vendor" },
                { path: "event" },
            ],
        });
};

/**
 * Find Guest Assignments By Vehicle Assignment.
 *
 * Populating the guest's location references ensures the duty-sheet
 * PDF can display actual pickup and drop location names.
 */
const findByVehicleAssignment = async (vehicleAssignmentId) => {
    return GuestAssignment.find({
        vehicleAssignment: vehicleAssignmentId,
        isDeleted: false,
    })
        .populate(guestDetailsPopulate)
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
                { path: "vehicle" },
                { path: "event" },
                { path: "vendor" },
            ],
        })
        .populate(guestDetailsPopulate);

    return assignments.filter(
        (assignment) => assignment.vehicleAssignment
    );
};

module.exports = {
    create,
    findById,
    findAll,
    updateById,
    updateByIdIfPending,
    softDelete,
    softDeleteIfPending,
    findByEvent,
    findByVehicleAssignment,
    findActiveByGuest,
    findByGuest,
    findByDriver,
    updateByIdIfState,
};
