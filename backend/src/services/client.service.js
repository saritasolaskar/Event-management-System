const mongoose = require("mongoose");
const crypto = require("crypto");

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

const pickClientFields = (data = {}) =>
  Object.fromEntries(
    Object.entries(data).filter(([key]) =>
      CLIENT_FIELDS.includes(key)
    )
  );

const normalizeClientData = (data) => ({
  ...data,

  ...(data.email && {
    email: data.email.toLowerCase(),
  }),

  ...(data.gstNumber && {
    gstNumber: data.gstNumber.toUpperCase(),
  }),

  ...(data.panNumber && {
    panNumber: data.panNumber.toUpperCase(),
  }),
});

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
 * Both operations are performed inside one MongoDB
 * transaction so we never end up with a Client without
 * the corresponding portal account.
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
         * ---------------------------------------------
         * 1. Validate duplicate Client information
         * ---------------------------------------------
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
         * ---------------------------------------------
         * 2. Create Client
         * ---------------------------------------------
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
         * ---------------------------------------------
         * 3. Check existing User account
         * ---------------------------------------------
         */

        const existingUser =
          await userRepository.findByEmail(
            data.email,
            session
          );

        if (existingUser) {

          /**
           * The email already belongs to another
           * application role.
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
           * The CLIENT account is already connected
           * to another Client.
           */
          if (
            existingUser.client &&
            existingUser.client.toString() !==
              createdClient._id.toString()
          ) {
            throw new AppError(
              "This user account is already linked to another client.",
              409
            );
          }

          /**
           * Existing CLIENT account was previously
           * created through public registration.
           *
           * Link it to the newly created Client.
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
         * ---------------------------------------------
         * 4. Check User phone collision
         * ---------------------------------------------
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
         * ---------------------------------------------
         * 5. Create Client User
         * ---------------------------------------------
         *
         * A random temporary password is used because
         * the client will establish their real password
         * through the password setup token.
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
         * ---------------------------------------------
         * 6. Generate password setup token
         * ---------------------------------------------
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
 */
const updateClient = async (
  clientId,
  updateData,
  userId
) => {
  const client =
    await clientRepository.findById(
      clientId
    );

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
    throw new AppError(
      "Client not found.",
      404
    );
  }

  const data =
    normalizeClientData(
      pickClientFields(updateData)
    );

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

  return clientRepository.updateById(
    clientId,
    {
      ...data,
      updatedBy: userId,
    }
  );
};

/**
 * Delete Client
 */
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

/**
 * Update Client Status
 */
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
    await clientRepository.updateStatusIfCurrent(
      clientId,
      client.status,
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