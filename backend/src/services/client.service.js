const clientRepository = require("../repositories/client.repository");

const AppError = require("../utils/appError");

/**
 * Create Client
 */
const createClient = async (clientData, userId) => {
  // Check if company name already exists
  const existingCompany = await clientRepository.findByCompanyName(
    clientData.companyName
  );

  if (existingCompany) {
    throw new AppError("Company name already exists.", 409);
  }

  // Check if email already exists
  const existingEmail = await clientRepository.findByEmail(
    clientData.email
  );

  if (existingEmail) {
    throw new AppError("Email already exists.", 409);
  }

  // Check if GST already exists (only if provided)
  if (clientData.gstNumber) {
    const existingGST = await clientRepository.findByGST(
      clientData.gstNumber
    );

    if (existingGST) {
      throw new AppError("GST Number already exists.", 409);
    }
  }

  // Add audit information
  clientData.createdBy = userId;
  clientData.updatedBy = userId;

  return await clientRepository.create(clientData);
};

/**
 * Get All Clients
 */
const getAllClients = async () => {
  return await clientRepository.findAll();
};

/**
 * Get Client By ID
 */
const getClientById = async (clientId) => {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  return client;
};

/**
 * Update Client
 */
const updateClient = async (clientId, updateData, userId) => {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  updateData.updatedBy = userId;

  return await clientRepository.updateById(
    clientId,
    updateData
  );
};

/**
 * Delete Client
 */
const deleteClient = async (clientId) => {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  await clientRepository.softDelete(clientId);
};

/**
 * Update Client Status
 */
const updateClientStatus = async (clientId, status) => {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  return await clientRepository.updateStatus(
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