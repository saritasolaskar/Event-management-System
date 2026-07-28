const driverService = require("../services/driver.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

/**
 * Create Driver
 */
const createDriver = asyncHandler(async (req, res) => {
  const driver = await driverService.createDriver(
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    201,
    "Driver created successfully.",
    driver
  );
});

/**
 * Get All Drivers
 */
const getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await driverService.getAllDrivers();

  return successResponse(
    res,
    200,
    "Drivers fetched successfully.",
    drivers
  );
});

/**
 * Get Driver By ID
 */
const getDriverById = asyncHandler(async (req, res) => {
  const driver = await driverService.getDriverById(req.params.id);

  return successResponse(
    res,
    200,
    "Driver fetched successfully.",
    driver
  );
});

/**
 * Update Driver
 */
const updateDriver = asyncHandler(async (req, res) => {
  const driver = await driverService.updateDriver(
    req.params.id,
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Driver updated successfully.",
    driver
  );
});

/**
 * Delete Driver
 */
const deleteDriver = asyncHandler(async (req, res) => {
  await driverService.deleteDriver(req.params.id);

  return successResponse(
    res,
    200,
    "Driver deleted successfully."
  );
});

/**
 * Update Driver Status
 */
const updateDriverStatus = asyncHandler(async (req, res) => {
  const driver = await driverService.updateDriverStatus(
    req.params.id,
    req.body.status
  );

  return successResponse(
    res,
    200,
    "Driver status updated successfully.",
    driver
  );
});

module.exports = {
  createDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
  updateDriverStatus,
};