const clientRepository = require("../repositories/client.repository");
const AppError = require("../utils/AppError");

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
  "status",
];

const pickClientFields = (data = {}) =>
  Object.fromEntries(
    Object.entries(data).filter(([key]) => CLIENT_FIELDS.includes(key))
  );

const normalizeClientData = (data) => ({
  ...data,
  ...(data.email && { email: data.email.toLowerCase() }),
  ...(data.gstNumber && { gstNumber: data.gstNumber.toUpperCase() }),
  ...(data.panNumber && { panNumber: data.panNumber.toUpperCase() }),
});

const validateAgreementDates = (startDate, endDate) => {
  if (
    startDate &&
    endDate &&
    new Date(endDate).getTime() < new Date(startDate).getTime()
  ) {
    throw new AppError(
      "Agreement end date cannot be before its start date.",
      422
    );
  }
};

const createClient = async (clientData, userId) => {
  const data = normalizeClientData(pickClientFields(clientData));

  validateAgreementDates(data.agreementStartDate, data.agreementEndDate);

  const existingCompany = await clientRepository.findByCompanyName(
    data.companyName
  );

  if (existingCompany) {
    throw new AppError("Company name already exists.", 409);
  }

  const existingEmail = await clientRepository.findByEmail(data.email);

  if (existingEmail) {
    throw new AppError("Email already exists.", 409);
  }

  if (data.gstNumber) {
    const existingGST = await clientRepository.findByGST(data.gstNumber);

    if (existingGST) {
      throw new AppError("GST Number already exists.", 409);
    }
  }

  return clientRepository.create({
    ...data,
    createdBy: userId,
    updatedBy: userId,
  });
};

const getAllClients = async (filter = {}) => {
  return clientRepository.findAll(filter);
};

const getClientById = async (clientId) => {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  return client;
};

const updateClient = async (clientId, updateData, userId) => {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  const data = normalizeClientData(pickClientFields(updateData));

  const startDate = Object.hasOwn(data, "agreementStartDate")
    ? data.agreementStartDate
    : client.agreementStartDate;

  const endDate = Object.hasOwn(data, "agreementEndDate")
    ? data.agreementEndDate
    : client.agreementEndDate;

  validateAgreementDates(startDate, endDate);

  if (data.companyName && data.companyName !== client.companyName) {
    const existingCompany = await clientRepository.findByCompanyName(
      data.companyName
    );

    if (
      existingCompany &&
      existingCompany._id.toString() !== client._id.toString()
    ) {
      throw new AppError("Company name already exists.", 409);
    }
  }

  if (data.email && data.email !== client.email) {
    const existingEmail = await clientRepository.findByEmail(data.email);

    if (
      existingEmail &&
      existingEmail._id.toString() !== client._id.toString()
    ) {
      throw new AppError("Email already exists.", 409);
    }
  }

  if (data.gstNumber && data.gstNumber !== client.gstNumber) {
    const existingGST = await clientRepository.findByGST(data.gstNumber);

    if (
      existingGST &&
      existingGST._id.toString() !== client._id.toString()
    ) {
      throw new AppError("GST Number already exists.", 409);
    }
  }

  return clientRepository.updateById(clientId, {
    ...data,
    updatedBy: userId,
  });
};

const deleteClient = async (clientId) => {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  await clientRepository.softDelete(clientId);

  return {
    message: "Client deleted successfully.",
  };
};

const updateClientStatus = async (clientId, status) => {
  const client = await clientRepository.findById(clientId);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  if (client.status === status) {
    throw new AppError(`Client is already ${status}.`, 400);
  }

  return clientRepository.updateStatus(clientId, status);
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  updateClientStatus,
};