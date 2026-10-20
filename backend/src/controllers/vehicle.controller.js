
const vehicleService = require("../services/vehicle.service");
const vehicleExcelImportService = require("../services/vehicleExcelImport.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

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

const getAllVehicles = asyncHandler(async (req, res) => {
  const vehicles = await vehicleService.getAllVehicles();

  return successResponse(
    res,
    200,
    "Vehicles fetched successfully.",
    vehicles
  );
});

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

const deleteVehicle = asyncHandler(async (req, res) => {
  await vehicleService.deleteVehicle(
    req.params.id,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Vehicle deleted successfully."
  );
});

const updateVehicleStatus = asyncHandler(async (req, res) => {
  const vehicle = await vehicleService.updateVehicleStatus(
    req.params.id,
    req.body.status,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Vehicle status updated successfully.",
    vehicle
  );
});

const getVehiclesByEvent = asyncHandler(async (req, res) => {
  const vehicles = await vehicleService.getVehiclesByEvent(
    req.params.eventId
  );

  return successResponse(
    res,
    200,
    "Event vehicles fetched successfully.",
    vehicles
  );
});

const importVehiclesFromExcel = asyncHandler(
  async (req, res) => {
    const result =
      await vehicleExcelImportService.importVehiclesFromExcel(
        req.file?.buffer,
        req.body.eventId,
        req.user._id
      );

    return successResponse(
      res,
      200,
      "Vehicle Excel import completed.",
      result
    );
  }
);

module.exports = {
  createVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  getVehiclesByEvent,
  importVehiclesFromExcel,
};
