
const mongoose = require("mongoose");
const crypto = require("crypto");
const Client =
    require("../models/client.model");


const clientRepository =
    require("../repositories/client.repository");

const userRepository =
    require("../repositories/user.repository");

const authService =
    require("./auth.service");

const AppError =
    require("../utils/AppError");

const eventRepository =
    require("../repositories/event.repository");

const { ROLES } =
    require("../constants/roles");

const { STATUS } =
    require("../constants/status");


const CLIENT_FIELDS = [
    "companyName",
    "email",
    "phone",
    "gstNumber",
    "panNumber",
    "industry",
    "address",
    "city",
    "state",
    "country",
    "pincode",
    "agreementStartDate",
    "agreementEndDate",
    "paymentTerms",
    "creditLimit",
];


/**
 * Pick allowed Client fields
 */
const pickClientFields = (
    data = {}
) =>
    Object.fromEntries(
        Object.entries(data).filter(
            ([key]) =>
                CLIENT_FIELDS.includes(key)
        )
    );


/**
 * Normalize Client data
 */
const normalizeClientData = (
    data
) => ({
    ...data,

    ...(data.email && {
        email:
            data.email.toLowerCase(),
    }),

    ...(data.gstNumber && {
        gstNumber:
            data.gstNumber.toUpperCase(),
    }),

    ...(data.panNumber && {
        panNumber:
            data.panNumber.toUpperCase(),
    }),
});


/**
 * Validate Agreement Dates
 */
const validateAgreementDates = (
    startDate,
    endDate
) => {
    if (
        startDate &&
        endDate &&
        new Date(endDate).getTime() <
            new Date(startDate).getTime()
    ) {
        throw new AppError(
            "Agreement end date cannot be before its start date.",
            422
        );
    }
};


/**
 * Create Client and Client Portal Account
 *
 * Client and portal account are created
 * inside one MongoDB transaction.
 */
const createClient = async (
    clientData,
    userId
) => {
    const data =
        normalizeClientData(
            pickClientFields(clientData)
        );

    validateAgreementDates(
        data.agreementStartDate,
        data.agreementEndDate
    );

    const session =
        await mongoose.startSession();

    let createdClient = null;
    let passwordSetupToken = null;
    let accountCreated = false;

    try {
        await session.withTransaction(
            async () => {

                /**
                 * ----------------------------------------
                 * 1. Duplicate Client checks
                 * ----------------------------------------
                 */

                const existingCompany =
                    await clientRepository.findByCompanyName(
                        data.companyName,
                        session
                    );

                if (existingCompany) {
                    throw new AppError(
                        "Company name already exists.",
                        409
                    );
                }

                const existingClientEmail =
                    await clientRepository.findByEmail(
                        data.email,
                        session
                    );

                if (existingClientEmail) {
                    throw new AppError(
                        "Email already exists.",
                        409
                    );
                }

                if (data.gstNumber) {
                    const existingGST =
                        await clientRepository.findByGST(
                            data.gstNumber,
                            session
                        );

                    if (existingGST) {
                        throw new AppError(
                            "GST Number already exists.",
                            409
                        );
                    }
                }


                /**
                 * ----------------------------------------
                 * 2. Create Client
                 * ----------------------------------------
                 */

                createdClient =
                    await clientRepository.create(
                        {
                            ...data,

                            status:
                                STATUS.ACTIVE,

                            createdBy:
                                userId,

                            updatedBy:
                                userId,

                            isDeleted:
                                false,

                            deletedAt:
                                null,
                        },
                        session
                    );


                /**
                 * ----------------------------------------
                 * 3. Check existing User
                 * ----------------------------------------
                 */

                const existingUser =
                    await userRepository.findByEmail(
                        data.email,
                        session
                    );

                if (existingUser) {

                    /**
                     * Email belongs to another role.
                     */
                    if (
                        existingUser.role !==
                        ROLES.CLIENT
                    ) {
                        throw new AppError(
                            "A user with this email already exists with a different role.",
                            409
                        );
                    }


                    /**
                     * CLIENT account already belongs
                     * to another Client.
                     */
                    if (
                        existingUser.client &&
                        existingUser.client
                            .toString() !==
                            createdClient._id.toString()
                    ) {
                        throw new AppError(
                            "This user account is already linked to another client.",
                            409
                        );
                    }


                    /**
                     * Link existing CLIENT user.
                     */
                    existingUser.client =
                        createdClient._id;

                    existingUser.status =
                        STATUS.ACTIVE;

                    await existingUser.save({
                        session,
                    });

                    return;
                }


                /**
                 * ----------------------------------------
                 * 4. Check phone collision
                 * ----------------------------------------
                 */

                const existingPhone =
                    await userRepository.findByPhone(
                        data.phone,
                        session
                    );

                if (existingPhone) {
                    throw new AppError(
                        "A user with this phone number already exists.",
                        409
                    );
                }


                /**
                 * ----------------------------------------
                 * 5. Create Client User
                 * ----------------------------------------
                 */

                const temporaryPassword =
                    crypto
                        .randomBytes(24)
                        .toString("hex");

                const clientUser =
                    await userRepository.create(
                        {
                            name:
                                data.companyName,

                            email:
                                data.email,

                            phone:
                                data.phone,

                            password:
                                temporaryPassword,

                            role:
                                ROLES.CLIENT,

                            status:
                                STATUS.ACTIVE,

                            client:
                                createdClient._id,

                            isEmailVerified:
                                false,

                            failedLoginAttempts:
                                0,

                            lockUntil:
                                null,

                            isDeleted:
                                false,
                        },
                        session
                    );


                /**
                 * ----------------------------------------
                 * 6. Generate Password Setup Token
                 * ----------------------------------------
                 */

                passwordSetupToken =
                    await authService.createPasswordSetupToken(
                        clientUser._id,
                        session
                    );

                accountCreated =
                    true;
            }
        );

        return {
            client:
                createdClient,

            portalAccount: {
                created:
                    accountCreated,

                ...(passwordSetupToken && {
                    passwordSetupToken,
                }),
            },
        };

    } finally {
        await session.endSession();
    }
};


/**
 * Get All Clients
 */
const getAllClients = async (
    filter = {}
) => {
    return clientRepository.findAll(
        filter
    );
};


/**
 * Get Client By ID
 */
const getClientById = async (
    clientId
) => {
    const client =
        await clientRepository.findById(
            clientId
        );

    if (!client) {
        throw new AppError(
            "Client not found.",
            404
        );
    }

    return client;
};


/**
 * Update Client
 *
 * Keeps the linked CLIENT portal account
 * synchronized with:
 * - companyName
 * - email
 * - phone
 */
const updateClient = async (
    clientId,
    updateData,
    userId
) => {

    /**
     * ----------------------------------------
     * 1. Get existing Client
     * ----------------------------------------
     */

    const client =
        await clientRepository.findById(
            clientId
        );

    if (!client) {
        throw new AppError(
            "Client not found.",
            404
        );
    }


    /**
     * Status must use dedicated endpoint.
     */
    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "status"
        )
    ) {
        throw new AppError(
            "Client status must be changed using the status endpoint.",
            400
        );
    }


    /**
     * ----------------------------------------
     * 2. Normalize update data
     * ----------------------------------------
     */

    const data =
        normalizeClientData(
            pickClientFields(updateData)
        );


    /**
     * ----------------------------------------
     * 3. Validate agreement dates
     * ----------------------------------------
     */

    const startDate =
        Object.hasOwn(
            data,
            "agreementStartDate"
        )
            ? data.agreementStartDate
            : client.agreementStartDate;

    const endDate =
        Object.hasOwn(
            data,
            "agreementEndDate"
        )
            ? data.agreementEndDate
            : client.agreementEndDate;

    validateAgreementDates(
        startDate,
        endDate
    );


    /**
     * ----------------------------------------
     * 4. Check duplicate company name
     * ----------------------------------------
     */

    if (
        data.companyName &&
        data.companyName !==
            client.companyName
    ) {
        const existingCompany =
            await clientRepository.findByCompanyName(
                data.companyName
            );

        if (
            existingCompany &&
            existingCompany._id.toString() !==
                client._id.toString()
        ) {
            throw new AppError(
                "Company name already exists.",
                409
            );
        }
    }


    /**
     * ----------------------------------------
     * 5. Check duplicate Client email
     * ----------------------------------------
     */

    if (
        data.email &&
        data.email !== client.email
    ) {
        const existingEmail =
            await clientRepository.findByEmail(
                data.email
            );

        if (
            existingEmail &&
            existingEmail._id.toString() !==
                client._id.toString()
        ) {
            throw new AppError(
                "Email already exists.",
                409
            );
        }
    }


    /**
     * ----------------------------------------
     * 6. Check duplicate GST
     * ----------------------------------------
     */

    if (
        data.gstNumber &&
        data.gstNumber !==
            client.gstNumber
    ) {
        const existingGST =
            await clientRepository.findByGST(
                data.gstNumber
            );

        if (
            existingGST &&
            existingGST._id.toString() !==
                client._id.toString()
        ) {
            throw new AppError(
                "GST Number already exists.",
                409
            );
        }
    }


    /**
     * ----------------------------------------
     * 7. Start transaction
     * ----------------------------------------
     */

    const session =
        await mongoose.startSession();

    let updatedClient;

    try {
        await session.withTransaction(
            async () => {

                /**
                 * ----------------------------------------
                 * Find linked portal account
                 * ----------------------------------------
                 */

                const portalUser =
                    await userRepository.findByClient(
                        clientId,
                        session
                    );


                /**
                 * ----------------------------------------
                 * If email changes, make sure the
                 * new email isn't already used by
                 * another User.
                 * ----------------------------------------
                 */

                if (
                    portalUser &&
                    data.email &&
                    data.email !==
                        portalUser.email
                ) {
                    const existingUserEmail =
                        await userRepository.findByEmail(
                            data.email,
                            session
                        );

                    if (
                        existingUserEmail &&
                        existingUserEmail._id
                            .toString() !==
                            portalUser._id.toString()
                    ) {
                        throw new AppError(
                            "This email is already used by another user account.",
                            409
                        );
                    }
                }


                /**
                 * ----------------------------------------
                 * If phone changes, make sure the
                 * new phone isn't already used by
                 * another User.
                 * ----------------------------------------
                 */

                if (
                    portalUser &&
                    data.phone &&
                    data.phone !==
                        portalUser.phone
                ) {
                    const existingUserPhone =
                        await userRepository.findByPhone(
                            data.phone,
                            session
                        );

                    if (
                        existingUserPhone &&
                        existingUserPhone._id
                            .toString() !==
                            portalUser._id.toString()
                    ) {
                        throw new AppError(
                            "This phone number is already used by another user account.",
                            409
                        );
                    }
                }


                /**
                 * ----------------------------------------
                 * Update Client
                 * ----------------------------------------
                 */

                updatedClient =
                    await clientRepository.updateById(
                        clientId,
                        {
                            ...data,

                            updatedBy:
                                userId,
                        },
                        session
                    );

                if (!updatedClient) {
                    throw new AppError(
                        "Client could not be updated.",
                        409
                    );
                }


                /**
                 * ----------------------------------------
                 * Synchronize portal account
                 * ----------------------------------------
                 */

                if (portalUser) {

                    const userUpdate = {};

                    /**
                     * Client company name
                     * → Portal user name
                     */
                    if (
                        data.companyName !==
                        undefined
                    ) {
                        userUpdate.name =
                            data.companyName;
                    }


                    /**
                     * Client email
                     * → Portal user email
                     */
                    if (
                        data.email !==
                        undefined
                    ) {
                        userUpdate.email =
                            data.email;
                    }


                    /**
                     * Client phone
                     * → Portal user phone
                     */
                    if (
                        data.phone !==
                        undefined
                    ) {
                        userUpdate.phone =
                            data.phone;
                    }


                    /**
                     * Only update User when
                     * something actually changed.
                     */
                    if (
                        Object.keys(
                            userUpdate
                        ).length > 0
                    ) {
                        await userRepository.updateById(
                            portalUser._id,
                            userUpdate,
                            session
                        );
                    }
                }
            }
        );

    } finally {
        await session.endSession();
    }


    return updatedClient;
};

/**
 * Delete Client
 */
const deleteClient = async (
    clientId,
    userId
) => {

    const session =
        await mongoose.startSession();

    try {

        await session.withTransaction(
            async () => {

                const client =
                    await clientRepository.findById(
                        clientId,
                        session
                    );

                if (!client) {
                    throw new AppError(
                        "Client not found.",
                        404
                    );
                }

                const events =
                    await eventRepository.findByClient(
                        clientId
                    );

                if (events.length > 0) {
                    throw new AppError(
                        "Client cannot be deleted because events already exist for this client.",
                        409
                    );
                }

                const deleted =
                    await clientRepository.softDelete(
                        clientId,
                        userId,
                        session
                    );

                if (!deleted) {
                    throw new AppError(
                        "Client could not be deleted.",
                        409
                    );
                }

                /*
                 * Disable the linked client portal account
                 * and invalidate all active refresh tokens.
                 */
                const portalUser =
                    await userRepository.findByClient(
                        clientId,
                        session
                    );

                if (portalUser) {
                    await userRepository.updateById(
                        portalUser._id,
                        {
                            status: STATUS.INACTIVE,
                            refreshTokens: [],
                        },
                        session
                    );
                }
            }
        );

        return {
            message:
                "Client deleted successfully.",
        };

    } finally {
        await session.endSession();
    }
};


/**
 * Restore Client
 *
 * Restores a soft-deleted Client and reactivates
 * the linked Client portal account.
 */
const restoreClient = async (
    clientId,
    userId
) => {
    const session =
        await mongoose.startSession();

    let restoredClient = null;

    try {
        await session.withTransaction(
            async () => {

                /**
                 * ----------------------------------------
                 * 1. Find deleted Client
                 * ----------------------------------------
                 */

                const client =
                    await clientRepository.findByIdIncludingDeleted(
                        clientId,
                        session
                    );

                if (!client) {
                    throw new AppError(
                        "Client not found.",
                        404
                    );
                }

                /**
                 * Client is already active.
                 */
                if (!client.isDeleted) {
                    throw new AppError(
                        "Client is already active.",
                        400
                    );
                }


                /**
                 * ----------------------------------------
                 * 2. Restore Client
                 * ----------------------------------------
                 */

                restoredClient =
                    await Client.findOneAndUpdate(
                        {
                            _id: clientId,
                            isDeleted: true,
                        },
                        {
                            isDeleted: false,
                            deletedAt: null,
                            status: STATUS.ACTIVE,
                            updatedBy: userId,
                        },
                        {
                            new: true,
                            runValidators: true,
                            session,
                        }
                    );

                if (!restoredClient) {
                    throw new AppError(
                        "Client could not be restored.",
                        409
                    );
                }


                /**
                 * ----------------------------------------
                 * 3. Restore linked Client portal account
                 * ----------------------------------------
                 *
                 * The portal User itself is not deleted
                 * during Client deletion. It is only made
                 * INACTIVE.
                 */

                const portalUser =
                    await userRepository.findByClient(
                        clientId,
                        session
                    );

                if (portalUser) {

                    await userRepository.updateById(
                        portalUser._id,
                        {
                            status:
                                STATUS.ACTIVE,

                            /*
                             * Do not restore old refresh
                             * tokens. The user must log in
                             * again after restoration.
                             */
                            refreshTokens: [],
                        },
                        session
                    );
                }
            }
        );

        return {
            message:
                "Client restored successfully.",

            client:
                restoredClient,
        };

    } finally {
        await session.endSession();
    }
};

/**
 * Update Client Status
 */
const updateClientStatus = async (
    clientId,
    status,
    userId
) => {

    if (
        !Object.values(STATUS).includes(
            status
        )
    ) {
        throw new AppError(
            "Invalid client status.",
            400
        );
    }

    const session =
        await mongoose.startSession();

    try {

        let updatedClient;

        await session.withTransaction(
            async () => {

                const client =
                    await clientRepository.findById(
                        clientId,
                        session
                    );

                if (!client) {
                    throw new AppError(
                        "Client not found.",
                        404
                    );
                }

                if (
                    client.status === status
                ) {
                    throw new AppError(
                        `Client is already ${status}.`,
                        400
                    );
                }

                updatedClient =
                    await clientRepository.updateStatusIfCurrent(
                        clientId,
                        client.status,
                        status,
                        userId,
                        session
                    );

                if (!updatedClient) {
                    throw new AppError(
                        "Client status could not be updated.",
                        409
                    );
                }

                /*
                 * Keep the client portal account synchronized
                 * with the Client's active/inactive state.
                 */
                const portalUser =
                    await userRepository.findByClient(
                        clientId,
                        session
                    );

                if (portalUser) {

                    const userStatus =
                        status === STATUS.ACTIVE
                            ? STATUS.ACTIVE
                            : STATUS.INACTIVE;

                    const updateData = {
                        status:
                            userStatus,
                    };

                    /*
                     * When disabling the client,
                     * invalidate existing sessions.
                     */
                    if (
                        userStatus ===
                        STATUS.INACTIVE
                    ) {
                        updateData.refreshTokens =
                            [];
                    }

                    await userRepository.updateById(
                        portalUser._id,
                        updateData,
                        session
                    );
                }
            }
        );

        return updatedClient;

    } finally {
        await session.endSession();
    }
};

module.exports = {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    deleteClient,
    restoreClient,
    updateClientStatus,
};