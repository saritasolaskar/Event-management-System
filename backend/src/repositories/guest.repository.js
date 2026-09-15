const Guest = require("../models/guest.model");

/**
 * Create Guest
 */
const create = async (
    guestData,
    session = null
) => {
    return Guest.create(
        [guestData],
        session
            ? { session }
            : undefined
    ).then((docs) => docs[0]);
};

/**
 * Find Guest By ID
 */
const findById = async (id) => {
    return Guest.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate("event", "eventCode name client status")
        .populate("pickupLocation", "name city")
        .populate("dropLocation", "name city");
};

/**
 * Find Guest By Code
 */
const findByGuestCode = async (guestCode) => {
    return Guest.findOne({
        guestCode,
        isDeleted: false,
    });
};

/**
 * Get Guests By Event
 */
const findByEvent = async (eventId) => {
    return Guest.find({
        event: eventId,
        isDeleted: false,
    })
        .populate("pickupLocation")
        .populate("dropLocation")
        .sort({
            firstName: 1,
            lastName: 1,
        });
};

/**
 * Get All Guests
 */
const findAll = async (filter = {}) => {
    return Guest.find({
        ...filter,
        isDeleted: false,
    })
        .populate("event", "eventCode name client status")
        .populate("pickupLocation", "name city")
        .populate("dropLocation", "name city")
        .sort({
            createdAt: -1,
        });
};

/**
 * Update Guest
 */
const updateById = async (
    id,
    updateData,
    session = null
) => {
    return Guest.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        updateData,
        {
            new: true,
            runValidators: true,
            ...(session
                ? { session }
                : {}),
        }
    );
};

/**
 * Soft Delete Guest
 */
const softDelete = async (
    id,
    userId,
    session = null
) => {
    return Guest.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            isDeleted: true,
            deletedAt: new Date(),
            updatedBy: userId,
        },
        {
            new: true,
            runValidators: true,
            ...(session
                ? { session }
                : {}),
        }
    );
};

/**
 * Update Guest Status
 */
const updateStatus = async (
    id,
    status,
    userId,
    session = null
) => {
    return Guest.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            status,
            updatedBy: userId,
        },
        {
            new: true,
            runValidators: true,
            ...(session
                ? { session }
                : {}),
        }
    );
};

/**
 * Find Guests By Event With Assignment
 *
 * Kept as an explicit repository method for callers
 * that need the guest list for an event.
 */
const findByEventWithAssignment = async (
    eventId
) => {
    return findByEvent(eventId);
};

module.exports = {
    create,
    findById,
    findByGuestCode,
    findByEvent,
    findByEventWithAssignment,
    findAll,
    updateById,
    softDelete,
    updateStatus,
};