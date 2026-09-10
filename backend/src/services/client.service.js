const clientRepository = require("../repositories/client.repository");
const AppError = require("../utils/AppError");
const eventRepository =
  require("../repositories/event.repository");
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
  status: "ACTIVE",
  createdBy: userId,
  updatedBy: userId,
  isDeleted: false,
  deletedAt: null,
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
 

// delete client


const deleteClient = async (
  clientId,
  userId
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
      userId
    );

  if (!deleted) {
    throw new AppError(
      "Client could not be deleted.",
      409
    );
  }

  return {
    message:
      "Client deleted successfully.",
  };
};


// update client status


const updateClientStatus = async (
  clientId,
  status,
  userId
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

  if (client.status === status) {
    throw new AppError(
      `Client is already ${status}.`,
      400
    );
  }

  const updatedClient =
    await clientRepository.updateStatus(
      clientId,
      status,
      userId
    );

  if (!updatedClient) {
    throw new AppError(
      "Client status could not be updated.",
      409
    );
  }

  return updatedClient;
};

module.exports = {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  updateClientStatus,
};