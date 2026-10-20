const mongoose = require("mongoose");
const crypto = require("crypto");

const driverRepository =
  require("../repositories/driver.repository");

const vendorRepository =
  require("../repositories/vendor.repository");

const vehicleRepository =
  require("../repositories/vehicle.repository");

const User =
  require("../models/user.model");

const AppError =
  require("../utils/AppError");

const { ROLES } =
  require("../constants/roles");

const {
  STATUS,
  VEHICLE_STATUS,
} =
  require("../constants/status");

const authService =
  require("./auth.service");

const vehicleAssignmentRepository =
  require("../repositories/vehicleAssignment.repository");


const DRIVER_UPDATE_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "dateOfBirth",
  "gender",
  "address",
  "city",
  "state",
  "pincode",
  "vendor",
  "currentVehicle",
  "licenseNumber",
  "licenseExpiry",
  "badgeNumber",
  "policeVerificationExpiry",
  "medicalCertificateExpiry",
];


const pickFields = (data, fields) => {
  const result = {};

  for (const field of fields) {
    if (
      Object.prototype.hasOwnProperty.call(
        data,
        field
      )
    ) {
      result[field] = data[field];
    }
  }

  return result;
};


const getId = (value) => {
  if (!value) {
    return null;
  }

  if (
    typeof value === "object" &&
    value._id
  ) {
    return value._id.toString();
  }

  return value.toString();
};


/**
 * Create Driver
 */
const createDriver = async (
  driverData,
  userId
) => {

  const session =
    await mongoose.startSession();

  let driver = null;
  let passwordSetupToken = null;

  try {

    await session.withTransaction(
      async () => {

        const vendor =
          await vendorRepository.findById(
            driverData.vendor,
            session
          );

        if (!vendor) {
          throw new AppError(
            "Vendor not found.",
            404
          );
        }

        const existingPhone =
          await driverRepository.findByPhone(
            driverData.phone,
            session
          );

        if (existingPhone) {
          throw new AppError(
            "Phone number already exists.",
            409
          );
        }

        if (driverData.email) {

          const existingEmail =
            await driverRepository.findByEmail(
              driverData.email,
              session
            );

          if (existingEmail) {
            throw new AppError(
              "Email already exists.",
              409
            );
          }
        }

        const existingLicense =
          await driverRepository.findByLicenseNumber(
            driverData.licenseNumber,
            session
          );

        if (existingLicense) {
          throw new AppError(
            "License number already exists.",
            409
          );
        }

        if (driverData.currentVehicle) {

          const vehicle =
            await vehicleRepository.findById(
              driverData.currentVehicle,
              session
            );

          if (!vehicle) {
            throw new AppError(
              "Current vehicle not found.",
              404
            );
          }

          const vehicleVendorId =
            getId(vehicle.vendor);

          if (
            !vehicleVendorId ||
            vehicleVendorId !==
              getId(driverData.vendor)
          ) {
            throw new AppError(
              "Current vehicle does not belong to the selected vendor.",
              400
            );
          }

          if (vehicle.currentDriver) {
            throw new AppError(
              "Current vehicle is already assigned to another driver.",
              409
            );
          }

          if (
            vehicle.status !==
            VEHICLE_STATUS.AVAILABLE
          ) {
            throw new AppError(
              "Current vehicle is not available.",
              400
            );
          }
        }

        const sanitizedDriverData = {
          firstName:
            driverData.firstName,

          lastName:
            driverData.lastName,

          phone:
            driverData.phone,

          email:
            driverData.email || null,

          dateOfBirth:
            driverData.dateOfBirth || null,

          gender:
            driverData.gender || null,

          vendor:
            driverData.vendor,

          currentVehicle:
            driverData.currentVehicle || null,

          licenseNumber:
            driverData.licenseNumber,

          licenseExpiry:
            driverData.licenseExpiry,

          badgeNumber:
            driverData.badgeNumber || null,

          policeVerificationExpiry:
            driverData.policeVerificationExpiry ||
            null,

          medicalCertificateExpiry:
            driverData.medicalCertificateExpiry ||
            null,

          rating:
            5,

          status:
            STATUS.ACTIVE,

          createdBy:
            userId,

          updatedBy:
            userId,

          isDeleted:
            false,
        };

        driver =
          await driverRepository.create(
            sanitizedDriverData,
            session
          );

        if (driver.currentVehicle) {

          const linkedVehicle =
            await vehicleRepository.updateById(
              driver.currentVehicle,
              {
                currentDriver:
                  driver._id,

                status:
                  VEHICLE_STATUS.ASSIGNED,

                updatedBy:
                  userId,
              },
              session
            );

          if (!linkedVehicle) {
            throw new AppError(
              "Failed to link current vehicle to driver.",
              500
            );
          }
        }

        const driverName =
          `${driver.firstName} ${driver.lastName}`.trim();

        const existingUser =
          await User.findOne({
            $or: [
              {
                phone:
                  driver.phone,
              },
              ...(driver.email
                ? [
                    {
                      email:
                        driver.email.toLowerCase(),
                    },
                  ]
                : []),
            ],
            isDeleted: false,
          }).session(session);

        if (existingUser) {

          if (
            existingUser.role !==
            ROLES.DRIVER
          ) {
            throw new AppError(
              "A user with this email or phone already exists with a different role.",
              409
            );
          }

          if (
            existingUser.driver &&
            getId(existingUser.driver) !==
              getId(driver._id)
          ) {
            throw new AppError(
              "This user account is already linked to another driver.",
              409
            );
          }

          existingUser.driver =
            driver._id;

          existingUser.status =
            STATUS.ACTIVE;

          await existingUser.save({
            session,
          });

        } else {

          const temporaryPassword =
            crypto
              .randomBytes(24)
              .toString("hex");

          await User.create(
            [
              {
                name:
                  driverName,

                email:
                  driver.email ||
                  `${driver.phone}@driver.local`,

                phone:
                  driver.phone,

                password:
                  temporaryPassword,

                role:
                  ROLES.DRIVER,

                driver:
                  driver._id,

                status:
                  STATUS.ACTIVE,

                isDeleted:
                  false,
              },
            ],
            {
              session,
            }
          );
        }

        const linkedUser =
          await User.findOne({
            driver:
              driver._id,

            isDeleted:
              false,
          }).session(session);

        if (!linkedUser) {
          throw new AppError(
            "Driver login account could not be created.",
            500
          );
        }

        passwordSetupToken =
          await authService.createPasswordSetupToken(
            linkedUser._id,
            session
          );
      }
    );

    return {
      driver,
      passwordSetupToken,
    };

  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};


/**
 * Get All Drivers
 */
const getAllDrivers = async () => {
  return driverRepository.findAll();
};


/**
 * Get Driver By ID
 */
const getDriverById = async (
  driverId
) => {

  const driver =
    await driverRepository.findById(
      driverId
    );

  if (!driver) {
    throw new AppError(
      "Driver not found.",
      404
    );
  }

  return driver;
};


/**
 * Update Driver
 */
const updateDriver = async (
  driverId,
  updateData,
  userId
) => {

  const sanitizedUpdateData =
    pickFields(
      updateData,
      DRIVER_UPDATE_FIELDS
    );

  if (
    Object.keys(
      sanitizedUpdateData
    ).length === 0
  ) {
    throw new AppError(
      "No valid fields provided for update.",
      400
    );
  }

  const session =
    await mongoose.startSession();

  let updatedDriver;

  try {

    await session.withTransaction(
      async () => {

        const driver =
          await driverRepository.findById(
            driverId,
            session
          );

        if (!driver) {
          throw new AppError(
            "Driver not found.",
            404
          );
        }

        if (
          Object.prototype.hasOwnProperty.call(
            sanitizedUpdateData,
            "vendor"
          )
        ) {

          const vendor =
            await vendorRepository.findById(
              sanitizedUpdateData.vendor,
              session
            );

          if (!vendor) {
            throw new AppError(
              "Vendor not found.",
              404
            );
          }
        }

        const effectiveVendorId =
          sanitizedUpdateData.vendor ||
          getId(driver.vendor);

        const vehicleWasUpdated =
          Object.prototype.hasOwnProperty.call(
            sanitizedUpdateData,
            "currentVehicle"
          );

        const oldVehicleId =
          getId(driver.currentVehicle);

        const newVehicleId =
          vehicleWasUpdated
            ? sanitizedUpdateData.currentVehicle
            : oldVehicleId;

        if (newVehicleId) {

          const vehicle =
            await vehicleRepository.findById(
              newVehicleId,
              session
            );

          if (!vehicle) {
            throw new AppError(
              "Current vehicle not found.",
              404
            );
          }

          if (
            getId(vehicle.vendor) !==
            getId(effectiveVendorId)
          ) {
            throw new AppError(
              "Current vehicle does not belong to the selected vendor.",
              400
            );
          }

          if (
            vehicle.currentDriver &&
            getId(vehicle.currentDriver) !==
              getId(driverId)
          ) {
            throw new AppError(
              "Current vehicle is already assigned to another driver.",
              409
            );
          }

          if (
            getId(vehicle.currentDriver) !==
              getId(driverId) &&
            vehicle.status !==
              VEHICLE_STATUS.AVAILABLE
          ) {
            throw new AppError(
              "Current vehicle is not available.",
              400
            );
          }
        }

        if (
          sanitizedUpdateData.phone &&
          sanitizedUpdateData.phone !==
            driver.phone
        ) {

          const existingPhone =
            await driverRepository.findByPhone(
              sanitizedUpdateData.phone,
              session
            );

          if (
            existingPhone &&
            getId(existingPhone._id) !==
              getId(driver._id)
          ) {
            throw new AppError(
              "Phone number already exists.",
              409
            );
          }
        }

        if (
          sanitizedUpdateData.email &&
          sanitizedUpdateData.email !==
            driver.email
        ) {

          const existingEmail =
            await driverRepository.findByEmail(
              sanitizedUpdateData.email,
              session
            );

          if (
            existingEmail &&
            getId(existingEmail._id) !==
              getId(driver._id)
          ) {
            throw new AppError(
              "Email already exists.",
              409
            );
          }
        }

        if (
          sanitizedUpdateData.licenseNumber &&
          sanitizedUpdateData.licenseNumber !==
            driver.licenseNumber
        ) {

          const existingLicense =
            await driverRepository.findByLicenseNumber(
              sanitizedUpdateData.licenseNumber,
              session
            );

          if (
            existingLicense &&
            getId(existingLicense._id) !==
              getId(driver._id)
          ) {
            throw new AppError(
              "License number already exists.",
              409
            );
          }
        }

        if (
          Object.prototype.hasOwnProperty.call(
            sanitizedUpdateData,
            "email"
          )
        ) {
          sanitizedUpdateData.email =
            sanitizedUpdateData.email || null;
        }

        if (
          Object.prototype.hasOwnProperty.call(
            sanitizedUpdateData,
            "currentVehicle"
          )
        ) {
          sanitizedUpdateData.currentVehicle =
            sanitizedUpdateData.currentVehicle ||
            null;
        }

        updatedDriver =
          await driverRepository.updateById(
            driverId,
            {
              ...sanitizedUpdateData,
              updatedBy:
                userId,
            },
            session
          );

        if (!updatedDriver) {
          throw new AppError(
            "Failed to update driver.",
            500
          );
        }

        if (vehicleWasUpdated) {

          if (
            oldVehicleId &&
            (
              !newVehicleId ||
              getId(oldVehicleId) !==
                getId(newVehicleId)
            )
          ) {

            await vehicleRepository.updateById(
              oldVehicleId,
              {
                currentDriver:
                  null,

                status:
                  VEHICLE_STATUS.AVAILABLE,

                updatedBy:
                  userId,
              },
              session
            );
          }

          if (
            newVehicleId &&
            (
              !oldVehicleId ||
              getId(oldVehicleId) !==
                getId(newVehicleId)
            )
          ) {

            const linkedVehicle =
              await vehicleRepository.updateById(
                newVehicleId,
                {
                  currentDriver:
                    driverId,

                  status:
                    VEHICLE_STATUS.ASSIGNED,

                  updatedBy:
                    userId,
                },
                session
              );

            if (!linkedVehicle) {
              throw new AppError(
                "Failed to link vehicle to driver.",
                500
              );
            }
          }
        }

        const linkedUser =
          await User.findOne({
            driver:
              driverId,

            isDeleted:
              false,
          }).session(session);

        if (linkedUser) {

          let userChanged =
            false;

          if (
            Object.prototype.hasOwnProperty.call(
              sanitizedUpdateData,
              "phone"
            ) &&
            sanitizedUpdateData.phone !==
              linkedUser.phone
          ) {

            const existingUserPhone =
              await User.findOne({
                phone:
                  sanitizedUpdateData.phone,

                _id: {
                  $ne:
                    linkedUser._id,
                },

                isDeleted:
                  false,
              }).session(session);

            if (existingUserPhone) {
              throw new AppError(
                "Phone number already exists for another user account.",
                409
              );
            }

            linkedUser.phone =
              sanitizedUpdateData.phone;

            userChanged =
              true;
          }

          if (
            Object.prototype.hasOwnProperty.call(
              sanitizedUpdateData,
              "email"
            )
          ) {

            const newEmail =
              sanitizedUpdateData.email
                ? sanitizedUpdateData.email.toLowerCase()
                : `${sanitizedUpdateData.phone || linkedUser.phone}@driver.local`;

            if (
              newEmail !==
              linkedUser.email
            ) {

              const existingUserEmail =
                await User.findOne({
                  email:
                    newEmail,

                  _id: {
                    $ne:
                      linkedUser._id,
                  },

                  isDeleted:
                    false,
                }).session(session);

              if (existingUserEmail) {
                throw new AppError(
                  "Email already exists for another user account.",
                  409
                );
              }

              linkedUser.email =
                newEmail;

              userChanged =
                true;
            }
          }

          if (userChanged) {
            await linkedUser.save({
              session,
            });
          }
        }
      }
    );

    return updatedDriver;

  } finally {
    await session.endSession();
  }
};


/**
 * Delete Driver
 */
const deleteDriver = async (
  driverId,
  userId
) => {

  const session =
    await mongoose.startSession();

  try {

    await session.withTransaction(
      async () => {

        const driver =
          await driverRepository.findById(
            driverId,
            session
          );

        if (!driver) {
          throw new AppError(
            "Driver not found.",
            404
          );
        }

        const activeAssignment =
          await vehicleAssignmentRepository.findActiveByDriver(
            driverId,
            null,
            session
          );

        if (activeAssignment) {
          throw new AppError(
            "Driver cannot be deleted while assigned to an active duty or event.",
            409
          );
        }

        await User.updateMany(
          {
            driver:
              driverId,

            isDeleted:
              false,
          },
          {
            $set: {
              status:
                STATUS.INACTIVE,
            },

            $unset: {
              refreshTokens:
                1,
            },
          },
          {
            session,
          }
        );

        if (driver.currentVehicle) {

          const vehicleId =
            getId(driver.currentVehicle);

          await vehicleRepository.updateById(
            vehicleId,
            {
              currentDriver:
                null,

              status:
                VEHICLE_STATUS.AVAILABLE,

              updatedBy:
                userId,
            },
            session
          );
        }

        await driverRepository.softDelete(
          driverId,
          userId,
          session
        );
      }
    );

    return {
      message:
        "Driver deleted successfully.",
    };

  } finally {
    await session.endSession();
  }
};


/**
 * Update Driver Status
 */
const updateDriverStatus = async (
  driverId,
  status,
  userId
) => {

  const session =
    await mongoose.startSession();

  try {

    let updatedDriver;

    await session.withTransaction(
      async () => {

        const driver =
          await driverRepository.findById(
            driverId,
            session
          );

        if (!driver) {
          throw new AppError(
            "Driver not found.",
            404
          );
        }

        if (
          !Object.values(STATUS).includes(
            status
          )
        ) {
          throw new AppError(
            "Invalid driver status.",
            400
          );
        }

        if (
          status !== STATUS.ACTIVE
        ) {

          const activeAssignment =
            await vehicleAssignmentRepository.findActiveByDriver(
              driverId,
              null,
              session
            );

          if (activeAssignment) {
            throw new AppError(
              "Driver status cannot be changed while the driver has an active assignment or duty.",
              409
            );
          }
        }

        updatedDriver =
          await driverRepository.updateStatus(
            driverId,
            status,
            userId,
            session
          );

        if (!updatedDriver) {
          throw new AppError(
            "Failed to update driver status.",
            500
          );
        }

        const linkedUser =
          await User.findOne({
            driver:
              driverId,

            isDeleted:
              false,
          }).session(session);

        if (linkedUser) {

          const userStatus =
            status === STATUS.ACTIVE
              ? STATUS.ACTIVE
              : STATUS.INACTIVE;

          if (
            linkedUser.status !==
            userStatus
          ) {

            linkedUser.status =
              userStatus;

            await linkedUser.save({
              session,
            });
          }
        }
      }
    );

    return updatedDriver;

  } finally {
    await session.endSession();
  }
};


module.exports = {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
};