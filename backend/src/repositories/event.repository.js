const Event =
    require("../models/event.model");

const {
    EVENT_STATUS,
} = require("../constants/status");

/**
 * Create Event
 */
const create = async (eventData) => {
    return Event.create(eventData);
};

/**
 * Find Event By ID
 */
const findById = async (id) => {
    return Event.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate(
            "client",
            "clientCode companyName"
        )
        .populate(
            "venue",
            "locationCode name city state"
        );
};

/**
 * Find Event By Code
 */
const findByEventCode = async (
    eventCode
) => {
    return Event.findOne({
        eventCode,
        isDeleted: false,
    });
};

/**
 * Get All Events
 */
const findAll = async (filter = {}) => {
    return Event.find({
        isDeleted: false,
        ...filter,
    })
        .populate(
            "client",
            "clientCode companyName"
        )
        .populate(
            "venue",
            "locationCode name city state"
        )
        .sort({
            startDate: -1,
        });
};

/**
 * Get Events By Client
 */
const findByClient = async (clientId) => {
    return Event.find({
        client: clientId,
        isDeleted: false,
    })
        .populate(
            "client",
            "clientCode companyName"
        )
        .populate(
            "venue",
            "locationCode name city state"
        )
        .sort({
            startDate: -1,
        })
        .lean();
};

/**
 * Update Event
 */
const updateById = async (
    id,
    updateData
) => {
    return Event.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );
};

/**
 * Soft Delete Event
 */
const softDelete = async (id) => {
    return Event.findOneAndUpdate(
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
};

/**
 * Update Event Status
 */
const updateStatus = async (
    id,
    status
) => {
    return Event.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            status,
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

/**
 * Find Active Events By Client
 */
const findActiveByClient = async (
    clientId
) => {
    return Event.find({
        client: clientId,
        status: EVENT_STATUS.ONGOING,
        isDeleted: false,
    });
};

/**
 * Find Events By Status
 */
const findByStatus = async (status) => {
    return Event.find({
        status,
        isDeleted: false,
    })
        .populate(
            "client",
            "clientCode companyName"
        )
        .populate(
            "venue",
            "locationCode name city state"
        )
        .sort({
            startDate: -1,
        });
};

/**
 * Count Events
 */
const count = async (filter = {}) => {
    return Event.countDocuments({
        isDeleted: false,
        ...filter,
    });
};

module.exports = {
    create,
    findById,
    findByEventCode,
    findAll,
    findByClient,
    updateById,
    softDelete,
    updateStatus,
    findActiveByClient,
    findByStatus,
    count,
};