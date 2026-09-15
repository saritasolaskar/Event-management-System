
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


/**
 * Create Driver
 */
const createDriver = async (
  driverData,
  userId
) => {

  /*
   * Check Vendor Exists
   */
  const vendor =
    await vendorRepository.findById(
      driverData.vendor
    );

  if (!vendor) {
    throw new AppError(
      "Vendor not found.",
      404
    );
  }


  /*
   * Check Phone Number
   */
  const existingPhone =
    await driverRepository.findByPhone(
      driverData.phone
    );

  if (existingPhone) {
    throw new AppError(
      "Phone number already exists.",
      409
    );
  }


  /*
   * Check Email
   */
  if (driverData.email) {

    const existingEmail =
      await driverRepository.findByEmail(
        driverData.email
      );

    if (existingEmail) {
      throw new AppError(
        "Email already exists.",
        409
      );
    }
  }


  /*
   * Check License Number
   */
  const existingLicense =
    await driverRepository.findByLicenseNumber(
      driverData.licenseNumber
    );

  if (existingLicense) {
    throw new AppError(
      "License number already exists.",
      409
    );
  }


  /*
   * Current Vehicle Validation
   */
  if (driverData.currentVehicle) {

    const vehicle =
      await vehicleRepository.findById(
        driverData.currentVehicle
      );

    if (!vehicle) {
      throw new AppError(
        "Current vehicle not found.",
        404
      );
    }

    const vehicleVendorId =
      vehicle.vendor?._id ||
      vehicle.vendor;

    if (
      !vehicleVendorId ||
      vehicleVendorId.toString() !==
        driverData.vendor.toString()
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


  /*
   * Whitelist Driver fields.
   *
   * Protected fields such as status,
   * rating, isDeleted and audit fields
   * are controlled by the server.
   */
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
      driverData.policeVerificationExpiry || null,

    medicalCertificateExpiry:
      driverData.medicalCertificateExpiry || null,

    /*
     * Server-controlled fields
     */
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


  /*
   * Driver creation and all related
   * operations are inside the rollback
   * protected block.
   */
  let driver;

  try {

    driver =
      await driverRepository.create(
        sanitizedDriverData
      );


    /*
     * Link current vehicle to the
     * newly created driver.
     */
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
          }
        );

      if (!linkedVehicle) {
        throw new AppError(
          "Failed to link current vehicle to driver.",
          500
        );
      }
    }


    /*
     * Create / link Driver Login User
     */
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
      });


    /*
     * Existing User
     */
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


      /*
       * Prevent the same login account
       * from being linked to another driver.
       */
      if (
        existingUser.driver &&
        existingUser.driver.toString() !==
          driver._id.toString()
      ) {
        throw new AppError(
          "This user account is already linked to another driver.",
          409
        );
      }


      /*
       * Preserve User state for rollback.
       */
      const previousDriver =
        existingUser.driver;

      const previousStatus =
        existingUser.status;

      const previousPasswordResetToken =
        existingUser.passwordResetToken;

      const previousPasswordResetExpires =
        existingUser.passwordResetExpires;


      existingUser.driver =
        driver._id;

      existingUser.status =
        STATUS.ACTIVE;

      await existingUser.save();


      try {

        const passwordSetupToken =
          await authService.createPasswordSetupToken(
            existingUser._id
          );

        return {
          driver,
          passwordSetupToken,
        };

      } catch (error) {

        /*
         * Restore User state.
         */
        existingUser.driver =
          previousDriver;

        existingUser.status =
          previousStatus;

        existingUser.passwordResetToken =
          previousPasswordResetToken;

        existingUser.passwordResetExpires =
          previousPasswordResetExpires;


        try {

          await existingUser.save();

        } catch (rollbackError) {

          console.error(
            "Failed to restore Driver User during rollback:",
            rollbackError
          );
        }

        throw error;
      }
    }


    /*
     * New Driver Login User
     */
    const crypto =
      require("crypto");

    const temporaryPassword =
      crypto.randomBytes(24).toString("hex");


    const user =
      await User.create({

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
      });


    try {

      const passwordSetupToken =
        await authService.createPasswordSetupToken(
          user._id
        );

      return {
        driver,
        passwordSetupToken,
      };

    } catch (error) {

      /*
       * Rollback newly created User.
       */
      try {

        await User.updateOne(
          {
            _id:
              user._id,
          },
          {
            $set: {
              isDeleted:
                true,

              status:
                STATUS.INACTIVE,
            },

            $unset: {
              refreshTokens:
                1,
            },
          }
        );

      } catch (rollbackError) {

        console.error(
          "Failed to rollback Driver User:",
          rollbackError
        );
      }

      throw error;
    }

  } catch (error) {

    /*
     * If the Driver was created and
     * something afterwards failed,
     * soft-delete the Driver.
     */
    if (driver?._id) {

      /*
       * If a vehicle was linked,
       * release it again.
       */
      if (driver.currentVehicle) {

        try {

          await vehicleRepository.updateById(
            driver.currentVehicle,
            {
              currentDriver:
                null,

              status:
                VEHICLE_STATUS.AVAILABLE,

              updatedBy:
                userId,
            }
          );

        } catch (rollbackError) {

          console.error(
            "Failed to rollback Driver Vehicle:",
            rollbackError
          );
        }
      }


      try {

        await driverRepository.softDelete(
          driver._id
        );

      } catch (rollbackError) {

        console.error(
          "Failed to rollback Driver:",
          rollbackError
        );
      }
    }

    throw error;
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

  /*
   * Whitelist update fields.
   */
  const allowedFields = [

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


  const sanitizedUpdateData = {};


  for (const field of allowedFields) {

    if (
      Object.prototype.hasOwnProperty.call(
        updateData,
        field
      )
    ) {

      sanitizedUpdateData[field] =
        updateData[field];

    }
  }


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


  updateData =
    sanitizedUpdateData;


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


  /*
   * Vendor Validation
   */
  if (updateData.vendor) {

    const vendor =
      await vendorRepository.findById(
        updateData.vendor
      );

    if (!vendor) {
      throw new AppError(
        "Vendor not found.",
        404
      );
    }
  }


  /*
   * Determine effective vendor.
   */
  const effectiveVendorId =
    updateData.vendor ||
    driver.vendor?._id ||
    driver.vendor;


  /*
   * Determine whether currentVehicle
   * was explicitly changed.
   */
  const vehicleWasUpdated =
    Object.prototype.hasOwnProperty.call(
      updateData,
      "currentVehicle"
    );


  /*
   * Determine effective vehicle.
   */
  const effectiveVehicleId =
    vehicleWasUpdated
      ? updateData.currentVehicle
      : (
          driver.currentVehicle?._id ||
          driver.currentVehicle
        );


  /*
   * Current Vehicle Validation
   */
  if (effectiveVehicleId) {

    const vehicle =
      await vehicleRepository.findById(
        effectiveVehicleId
      );

    if (!vehicle) {
      throw new AppError(
        "Current vehicle not found.",
        404
      );
    }


    const vehicleVendorId =
      vehicle.vendor?._id ||
      vehicle.vendor;


    if (
      !effectiveVendorId ||
      !vehicleVendorId ||
      effectiveVendorId.toString() !==
        vehicleVendorId.toString()
    ) {

      throw new AppError(
        "Current vehicle does not belong to the selected vendor.",
        400
      );

    }


    /*
     * Do not allow another driver
     * to take this vehicle.
     */
    if (
      vehicle.currentDriver &&
      vehicle.currentDriver.toString() !==
        driverId.toString()
    ) {

      throw new AppError(
        "Current vehicle is already assigned to another driver.",
        409
      );

    }


    /*
     * A vehicle already assigned to
     * this driver is allowed.
     *
     * Otherwise it must be AVAILABLE.
     */
    if (
      vehicle.currentDriver?.toString() !==
        driverId.toString() &&
      vehicle.status !==
        VEHICLE_STATUS.AVAILABLE
    ) {

      throw new AppError(
        "Current vehicle is not available.",
        400
      );

    }
  }


  /*
   * Phone Validation
   */
  if (
    updateData.phone &&
    updateData.phone !==
      driver.phone
  ) {

    const existingPhone =
      await driverRepository.findByPhone(
        updateData.phone
      );

    if (
      existingPhone &&
      existingPhone._id.toString() !==
        driver._id.toString()
    ) {

      throw new AppError(
        "Phone number already exists.",
        409
      );

    }
  }


  /*
   * Email Validation
   */
  if (
    updateData.email &&
    updateData.email !==
      driver.email
  ) {

    const existingEmail =
      await driverRepository.findByEmail(
        updateData.email
      );

    if (
      existingEmail &&
      existingEmail._id.toString() !==
        driver._id.toString()
    ) {

      throw new AppError(
        "Email already exists.",
        409
      );

    }
  }


  /*
   * License Validation
   */
  if (
    updateData.licenseNumber &&
    updateData.licenseNumber !==
      driver.licenseNumber
  ) {

    const existingLicense =
      await driverRepository.findByLicenseNumber(
        updateData.licenseNumber
      );

    if (
      existingLicense &&
      existingLicense._id.toString() !==
        driver._id.toString()
    ) {

      throw new AppError(
        "License number already exists.",
        409
      );

    }
  }


  /*
   * Store old vehicle so we can
   * synchronize it after the update.
   */
  const oldVehicleId =
    driver.currentVehicle?._id ||
    driver.currentVehicle;


  const newVehicleId =
    vehicleWasUpdated
      ? updateData.currentVehicle
      : oldVehicleId;


  /*
   * Update Driver.
   */
  const updatedDriver =
    await driverRepository.updateById(
      driverId,
      {
        ...updateData,

        updatedBy:
          userId,
      }
    );


  if (!updatedDriver) {
    throw new AppError(
      "Failed to update driver.",
      500
    );
  }


  /*
   * Synchronize Driver ↔ Vehicle
   */
  if (vehicleWasUpdated) {

    /*
     * Release old vehicle when the
     * driver is moved or unassigned.
     */
    if (
      oldVehicleId &&
      (
        !newVehicleId ||
        oldVehicleId.toString() !==
          newVehicleId.toString()
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
        }
      );
    }


    /*
     * Assign new vehicle.
     */
    if (
      newVehicleId &&
      (
        !oldVehicleId ||
        oldVehicleId.toString() !==
          newVehicleId.toString()
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
          }
        );


      if (!linkedVehicle) {

        throw new AppError(
          "Failed to link vehicle to driver.",
          500
        );

      }
    }
  }


  /*
   * Keep linked login user synchronized
   * when phone/email changes.
   */
  const linkedUser =
    await User.findOne({
      driver:
        driverId,

      isDeleted:
        false,
    });


  if (linkedUser) {

    let userChanged =
      false;


    if (
      updateData.phone &&
      updateData.phone !==
        linkedUser.phone
    ) {

      linkedUser.phone =
        updateData.phone;

      userChanged =
        true;
    }


    if (
      updateData.email &&
      updateData.email !==
        linkedUser.email
    ) {

      linkedUser.email =
        updateData.email.toLowerCase();

      userChanged =
        true;
    }


    if (userChanged) {
      await linkedUser.save();
    }
  }


  return updatedDriver;
};


/**
 * Delete Driver
 */
const deleteDriver = async (
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


  /*
   * Prevent deletion while driver
   * is assigned to an active event/duty.
   */
  const activeAssignment =
    await vehicleAssignmentRepository.findActiveByDriver(
      driverId
    );


  if (activeAssignment) {

    throw new AppError(
      "Driver cannot be deleted while assigned to an active duty or event.",
      409
    );

  }


  /*
   * Disable linked login account
   * before soft-deleting driver.
   */
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
    }
  );


  /*
   * Release driver's current vehicle.
   */
  if (driver.currentVehicle) {

    const vehicleId =
      driver.currentVehicle?._id ||
      driver.currentVehicle;


    await vehicleRepository.updateById(
      vehicleId,
      {
        currentDriver:
          null,

        status:
          VEHICLE_STATUS.AVAILABLE,
      }
    );
  }


  await driverRepository.softDelete(
    driverId
  );


  return {
    message:
      "Driver deleted successfully.",
  };
};


/**
 * Update Driver Status
 */
const updateDriverStatus = async (
  driverId,
  status
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


  if (
    status !== STATUS.ACTIVE &&
    status !== STATUS.INACTIVE &&
    status !== STATUS.SUSPENDED &&
    status !== STATUS.BLOCKED
  ) {

    throw new AppError(
      "Invalid driver status.",
      400
    );

  }


  /*
   * A driver with an active assignment
   * cannot be made inactive, suspended,
   * or blocked.
   */
  if (
    status !== STATUS.ACTIVE
  ) {

    const activeAssignment =
      await vehicleAssignmentRepository.findActiveByDriver(
        driverId
      );


    if (activeAssignment) {

      throw new AppError(
        "Driver status cannot be changed while the driver has an active assignment or duty.",
        409
      );

    }
  }


  const updatedDriver =
    await driverRepository.updateStatus(
      driverId,
      status
    );


  /*
   * Keep Driver login status aligned
   * with the Driver record.
   */
  const linkedUser =
    await User.findOne({
      driver:
        driverId,

      isDeleted:
        false,
    });


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

      await linkedUser.save();
    }
  }


  return updatedDriver;
};


module.exports = {

  createDriver,

  getAllDrivers,

  getDriverById,

  updateDriver,

  deleteDriver,

  updateDriverStatus,

};
