const clientRepository = require("../repositories/client.repository");

const AppError = require("../utils/appError");

/**
 * Create Client
 */
const createClient = async (clientData, userId) => {

    const existingCompany =
        await clientRepository.findByCompanyName(
            clientData.companyName
        );

    if (existingCompany) {
        throw new AppError(
            "Company name already exists.",
            409
        );
    }

    const existingEmail =
        await clientRepository.findByEmail(
            clientData.email
        );

    if (existingEmail) {
        throw new AppError(
            "Email already exists.",
            409
        );
    }

    if (clientData.gstNumber) {

        const existingGST =
            await clientRepository.findByGST(
                clientData.gstNumber
            );

        if (existingGST) {
            throw new AppError(
                "GST Number already exists.",
                409
            );
        }
    }

    clientData.createdBy = userId;
    clientData.updatedBy = userId;

    return clientRepository.create(clientData);
};

/**
 * Get All Clients
 */
const getAllClients = async (filter = {}) => {

    return clientRepository.findAll(filter);

};

/**
 * Get Client By ID
 */
const getClientById = async (clientId) => {

    const client =
        await clientRepository.findById(clientId);

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
 */
const updateClient = async (
    clientId,
    updateData,
    userId
) => {

    const client =
        await clientRepository.findById(clientId);

    if (!client) {
        throw new AppError(
            "Client not found.",
            404
        );
    }

    if (
        updateData.companyName &&
        updateData.companyName !== client.companyName
    ) {

        const existingCompany =
            await clientRepository.findByCompanyName(
                updateData.companyName
            );

        if (
            existingCompany &&
            existingCompany._id.toString() !== clientId
        ) {
            throw new AppError(
                "Company name already exists.",
                409
            );
        }
    }

    if (
        updateData.email &&
        updateData.email !== client.email
    ) {

        const existingEmail =
            await clientRepository.findByEmail(
                updateData.email
            );

        if (
            existingEmail &&
            existingEmail._id.toString() !== clientId
        ) {
            throw new AppError(
                "Email already exists.",
                409
            );
        }
    }

    if (
        updateData.gstNumber &&
        updateData.gstNumber !== client.gstNumber
    ) {

        const existingGST =
            await clientRepository.findByGST(
                updateData.gstNumber
            );

        if (
            existingGST &&
            existingGST._id.toString() !== clientId
        ) {
            throw new AppError(
                "GST Number already exists.",
                409
            );
        }
    }

    updateData.updatedBy = userId;

    return clientRepository.updateById(
        clientId,
        updateData
    );
};

/**
 * Delete Client
 */
const deleteClient = async (clientId) => {

    const client =
        await clientRepository.findById(clientId);

    if (!client) {
        throw new AppError(
            "Client not found.",
            404
        );
    }

    await clientRepository.softDelete(clientId);

    return {
        message: "Client deleted successfully.",
    };
};

/**
 * Update Client Status
 */
const updateClientStatus = async (
    clientId,
    status
) => {

    const client =
        await clientRepository.findById(clientId);

    if (!client) {
        throw new AppError(
            "Client not found.",
            404
        );
    }

    if (client.status === status) {
        throw new AppError(
            `Client is already ${status}.`,
            400
        );
    }

    return clientRepository.updateStatus(
        clientId,
        status
    );
};

module.exports = {
    createClient,
    getAllClients,
    getClientById,
    updateClient,
    deleteClient,
    updateClientStatus,
};