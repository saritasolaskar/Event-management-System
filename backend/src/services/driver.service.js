const driverRepository =
  require("../repositories/driver.repository");

const vendorRepository =
  require("../repositories/vendor.repository");

const User =
  require("../models/user.model");

const AppError =
  require("../utils/AppError");

const { ROLES } =
  require("../constants/roles");

const { STATUS } =
  require("../constants/status");

const authService =
  require("./auth.service");


/**
 * Create Driver
 */
const createDriver = async (
  driverData,
  userId
) => {

  // Check Vendor Exists
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


  // Check Phone Number
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


  // Check Email
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


  // Check License Number
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


  driverData.createdBy = userId;
  driverData.updatedBy = userId;


  const driver =
    await driverRepository.create(
      driverData
    );


  /*
   * Create / link Driver Login User
   */
  const driverName =
    `${driver.firstName} ${driver.lastName}`.trim();


  const existingUser =
    await User.findOne({
      $or: [
        {
          phone: driver.phone,
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


    existingUser.driver =
      driver._id;

    existingUser.status =
      STATUS.ACTIVE;

    await existingUser.save();


    /*
     * Generate one-time password
     * setup token.
     */
    const passwordSetupToken =
      await authService.createPasswordSetupToken(
        existingUser._id
      );


    return {
      driver,
      passwordSetupToken,
    };
  }


  /*
   * New Driver Login User
   *
   * Generate a random temporary password.
   * The driver will replace it using
   * the password setup token.
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


  /*
   * Generate one-time password
   * setup token.
   */
  const passwordSetupToken =
    await authService.createPasswordSetupToken(
      user._id
    );


  return {
    driver,
    passwordSetupToken,
  };
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


  // Vendor Validation
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


  // Phone Validation
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


  // Email Validation
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


  // License Validation
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


  const updatedDriver =
    await driverRepository.updateById(
      driverId,
      {
        ...updateData,
        updatedBy: userId,
      }
    );


  /*
   * Keep linked login user synchronized
   * when phone/email changes.
   */
  const linkedUser =
    await User.findOne({
      driver: driverId,
      isDeleted: false,
    });


  if (linkedUser) {

    let userChanged = false;


    if (
      updateData.phone &&
      updateData.phone !==
        linkedUser.phone
    ) {

      linkedUser.phone =
        updateData.phone;

      userChanged = true;
    }


    if (
      updateData.email &&
      updateData.email !==
        linkedUser.email
    ) {

      linkedUser.email =
        updateData.email.toLowerCase();

      userChanged = true;
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
   * Disable linked login account
   * before soft-deleting driver.
   */
  await User.updateMany(
    {
      driver: driverId,
      isDeleted: false,
    },
    {
      $set: {
        status:
          STATUS.INACTIVE,
      },
      $unset: {
        refreshTokens: 1,
      },
    }
  );


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
      driver: driverId,
      isDeleted: false,
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