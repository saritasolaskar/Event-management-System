const Location =
    require("../models/location.model");


const create = async (
    locationData,
    session = null
) => {

    if (session) {
        const [location] =
            await Location.create(
                [locationData],
                { session }
            );

        return location;
    }

    return Location.create(
        locationData
    );
};


const findById = async (
    id,
    session = null
) => {

    const query =
        Location.findOne({
            _id: id,
            isDeleted: false,
        });

    if (session) {
        query.session(session);
    }

    return query;
};


const findByLocationCode = async (
    locationCode,
    session = null
) => {

    const query =
        Location.findOne({
            locationCode,
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

    return Location.find({
        isDeleted: false,
        ...filter,
    }).sort({
        city: 1,
        name: 1,
    });
};


const findByCity = async (
    city
) => {

    return Location.find({
        city,
        isDeleted: false,
    }).sort({
        name: 1,
    });
};


const count = async (
    filter = {}
) => {

    return Location.countDocuments({
        isDeleted: false,
        ...filter,
    });
};


const updateById = async (
    id,
    updateData,
    session = null
) => {

    return Location.findOneAndUpdate(
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


const softDelete = async (
    id,
    userId,
    session = null
) => {

    return Location.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            isDeleted: true,
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
 * Atomically update Location Status
 *
 * The status is updated only if the location's current
 * status still matches the status originally read.
 */
const updateStatusIfCurrent = async (
    id,
    currentStatus,
    status,
    userId,
    session = null
) => {

    return Location.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
            status: currentStatus,
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


module.exports = {
    create,
    findById,
    findByLocationCode,
    findAll,
    findByCity,
    count,
    updateById,
    softDelete,
    updateStatusIfCurrent,
};