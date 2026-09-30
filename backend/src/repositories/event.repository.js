
const Event =
    require("../models/event.model");

const {
    EVENT_STATUS,
} = require("../constants/status");


const create = async (
    eventData,
    session = null
) => {

    if (session) {
        const [event] =
            await Event.create(
                [eventData],
                { session }
            );

        return event;
    }

    return Event.create(eventData);
};


const findById = async (
    id,
    session = null
) => {

    const query =
        Event.findOne({
            _id: id,
            isDeleted: false,
        })
            .populate(
                "client",
                "companyName email phone gstNumber panNumber"
            )
            .populate(
                "venue",
                "locationCode name city state"
            );

    if (session) {
        query.session(session);
    }

    return query;
};


const findByEventCode = async (
    eventCode,
    session = null
) => {

    const query =
        Event.findOne({
            eventCode,
            isDeleted: false,
        });

    if (session) {
        query.session(session);
    }

    return query;
};


const findAll = async (
    filter = {}
) => {

    return Event.find({
        isDeleted: false,
        ...filter,
    })
        .populate(
            "client",
            "companyName email phone gstNumber panNumber"
        )
        .populate(
            "venue",
            "locationCode name city state"
        )
        .sort({
            startDate: -1,
        });
};


const findByClient = async (
    clientId
) => {

    return Event.find({
        client: clientId,
        isDeleted: false,
    })
        .populate(
            "client",
            "companyName email phone gstNumber panNumber"
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


const updateById = async (
    id,
    updateData,
    session = null
) => {

    const query =
        Event.findOneAndUpdate(
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

    return query;
};


const softDelete = async (
    id,
    updatedBy = null,
    session = null
) => {

    const updateData = {
        isDeleted: true,
    };

    if (updatedBy) {
        updateData.updatedBy =
            updatedBy;
    }

    return Event.findOneAndUpdate(
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


const updateStatus = async (
    id,
    status,
    updatedBy = null,
    session = null
) => {

    const updateData = {
        status,
    };

    if (updatedBy) {
        updateData.updatedBy =
            updatedBy;
    }

    return Event.findOneAndUpdate(
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


const findActiveByClient = async (
    clientId,
    session = null
) => {

    const query =
        Event.find({
            client: clientId,
            status:
                EVENT_STATUS.ONGOING,
            isDeleted: false,
        });

    if (session) {
        query.session(session);
    }

    return query;
};


const findByStatus = async (
    status,
    session = null
) => {

    const query =
        Event.find({
            status,
            isDeleted: false,
        })
            .populate(
                "client",
                "companyName email phone gstNumber panNumber"
            )
            .populate(
                "venue",
                "locationCode name city state"
            )
            .sort({
                startDate: -1,
            });

    if (session) {
        query.session(session);
    }

    return query;
};


const count = async (
    filter = {}
) => {

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
