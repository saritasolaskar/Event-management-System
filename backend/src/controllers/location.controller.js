const locationService = require("../services/location.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

/**
 * Create Location
 */
const createLocation = asyncHandler(async (req, res) => {
  const location = await locationService.createLocation(
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    201,
    "Location created successfully.",
    location
  );
});

/**
 * Get All Locations
 */
const getAllLocations = asyncHandler(async (req, res) => {
  const locations =
    await locationService.getAllLocations();

  return successResponse(
    res,
    200,
    "Locations fetched successfully.",
    locations
  );
});

/**
 * Get Location By ID
 */
const getLocationById = asyncHandler(async (req, res) => {
  const location =
    await locationService.getLocationById(
      req.params.id
    );

  return successResponse(
    res,
    200,
    "Location fetched successfully.",
    location
  );
});

/**
 * Update Location
 */
const updateLocation = asyncHandler(async (req, res) => {
  const location =
    await locationService.updateLocation(
      req.params.id,
      req.body,
      req.user._id
    );

  return successResponse(
    res,
    200,
    "Location updated successfully.",
    location
  );
});

/**
 * Delete Location
 */
const deleteLocation = asyncHandler(async (req, res) => {
  await locationService.deleteLocation(
    req.params.id
  );

  return successResponse(
    res,
    200,
    "Location deleted successfully."
  );
});

/**
 * Update Location Status
 */
const updateLocationStatus = asyncHandler(
  async (req, res) => {
    const location =
      await locationService.updateLocationStatus(
        req.params.id,
        req.body.status
      );

    return successResponse(
      res,
      200,
      "Location status updated successfully.",
      location
    );
  }
);

module.exports = {
  createLocation,
  getAllLocations,
  getLocationById,
  updateLocation,
  deleteLocation,
  updateLocationStatus,
};