
const Client = require("../models/client.model");

/**
 * Create Client
 */
const create = async (
    clientData,
    session = null
) => {
    if (session) {
        const [client] =
            await Client.create(
                [clientData],
                { session }
            );

        return client;
    }

    return Client.create(clientData);
};

/**
 * Find Client By ID
 */
const findById = async (
    id,
    session = null
) => {
    const query = Client.findOne({
        _id: id,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Client By Company Name
 */
const findByCompanyName = async (
    companyName,
    session = null
) => {
    const query = Client.findOne({
        companyName,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Client By Email
 */
const findByEmail = async (
    email,
    session = null
) => {
    const query = Client.findOne({
        email,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Find Client By GST Number
 */
const findByGST = async (
    gstNumber,
    session = null
) => {
    const query = Client.findOne({
        gstNumber,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Get All Clients
 */
const findAll = async (
    filter = {}
) => {
    return Client.find({
        isDeleted: false,
        ...filter,
    }).sort({
        createdAt: -1,
    });
};

/**
 * Update Client
 */
const updateById = async (
    id,
    updateData,
    session = null
) => {
    const query =
        Client.findOneAndUpdate(
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

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Soft Delete Client
 */
const softDelete = async (
    id,
    userId,
    session = null
) => {
    const query =
        Client.findOneAndUpdate(
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
            }
        );

    if (session) {
        query.session(session);
    }

    return query;
};

/**
 * Atomically Update Client Status
 */
const updateStatusIfCurrent = async (
    id,
    currentStatus,
    status,
    userId,
    session = null
) => {

    const query =
        Client.findOneAndUpdate(
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
            }
        );

    if (session) {
        query.session(session);
    }

    return query;
};

module.exports = {
    create,
    findById,
    findByCompanyName,
    findByEmail,
    findByGST,
    findAll,
    updateById,
    softDelete,
    updateStatusIfCurrent,
};
