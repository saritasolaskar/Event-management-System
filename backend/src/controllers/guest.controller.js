const guestService = require("../services/guest.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

/**
 * Create Guest
 */
const createGuest = asyncHandler(async (req, res) => {
  const guest = await guestService.createGuest(
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    201,
    "Guest created successfully.",
    guest
  );
});

/**
 * Get All Guests
 */
const getAllGuests = asyncHandler(async (req, res) => {
  const guests = await guestService.getAllGuests();

  return successResponse(
    res,
    200,
    "Guests fetched successfully.",
    guests
  );
});

/**
 * Get Guests By Event
 */
const getGuestsByEvent = asyncHandler(async (req, res) => {
  const guests = await guestService.getGuestsByEvent(
    req.params.eventId
  );

  return successResponse(
    res,
    200,
    "Guests fetched successfully.",
    guests
  );
});

/**
 * Get Guest By ID
 */
const getGuestById = asyncHandler(async (req, res) => {
  const guest = await guestService.getGuestById(
    req.params.id
  );

  return successResponse(
    res,
    200,
    "Guest fetched successfully.",
    guest
  );
});

/**
 * Update Guest
 */
const updateGuest = asyncHandler(async (req, res) => {
  const guest = await guestService.updateGuest(
    req.params.id,
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Guest updated successfully.",
    guest
  );
});

/**
 * Delete Guest
 */
const deleteGuest = asyncHandler(async (req, res) => {
  await guestService.deleteGuest(req.params.id);

  return successResponse(
    res,
    200,
    "Guest deleted successfully."
  );
});

/**
 * Update Guest Status
 */
const updateGuestStatus = asyncHandler(async (req, res) => {
  const guest = await guestService.updateGuestStatus(
    req.params.id,
    req.body.status
  );

  return successResponse(
    res,
    200,
    "Guest status updated successfully.",
    guest
  );
});

module.exports = {
  createGuest,
  getAllGuests,
  getGuestsByEvent,
  getGuestById,
  updateGuest,
  deleteGuest,
  updateGuestStatus,
};