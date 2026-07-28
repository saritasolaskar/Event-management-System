const vehicleService = require("../services/vehicle.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

/**
 * Create Vehicle
 */
const createVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.createVehicle(
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    201,
    "Vehicle created successfully.",
    vehicle
  );
});

/**
 * Get All Vehicles
 */
const getAllVehicles = asyncHandler(async (req, res) => {
  const vehicles = await vehicleService.getAllVehicles();

  return successResponse(
    res,
    200,
    "Vehicles fetched successfully.",
    vehicles
  );
});

/**
 * Get Vehicle By ID
 */
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.getVehicleById(
    req.params.id
  );

  return successResponse(
    res,
    200,
    "Vehicle fetched successfully.",
    vehicle
  );
});

/**
 * Update Vehicle
 */
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateVehicle(
    req.params.id,
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Vehicle updated successfully.",
    vehicle
  );
});

/**
 * Delete Vehicle
 */
const deleteVehicle = asyncHandler(async (req, res) => {
  await vehicleService.deleteVehicle(req.params.id);

  return successResponse(
    res,
    200,
    "Vehicle deleted successfully."
  );
});

/**
 * Update Vehicle Status
 */
const updateVehicleStatus = asyncHandler(async (req, res) => {
  const vehicle =
    await vehicleService.updateVehicleStatus(
      req.params.id,
      req.body.status
    );

  return successResponse(
    res,
    200,
    "Vehicle status updated successfully.",
    vehicle
  );
});

module.exports = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
};