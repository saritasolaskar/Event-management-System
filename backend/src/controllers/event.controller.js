const eventService = require("../services/event.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

/**
 * Create Event
 */
const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    201,
    "Event created successfully.",
    event
  );
});

/**
 * Get All Events
 */
const getAllEvents = asyncHandler(async (req, res) => {
  const events = await eventService.getAllEvents();

  return successResponse(
    res,
    200,
    "Events fetched successfully.",
    events
  );
});

/**
 * Get Event By ID
 */
const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(
    req.params.id
  );

  return successResponse(
    res,
    200,
    "Event fetched successfully.",
    event
  );
});

/**
 * Update Event
 */
const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(
    req.params.id,
    req.body,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Event updated successfully.",
    event
  );
});

/**
 * Delete Event
 */
const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(
    req.params.id,
   req.user._id
  );

  return successResponse(
    res,
    200,
    "Event deleted successfully."
  );
});

/**
 * Update Event Status
 */
const updateEventStatus = asyncHandler(async (req, res) => {
  const event = await eventService.updateEventStatus(
    req.params.id,
    req.body.status,
    req.user._id
  );

  return successResponse(
    res,
    200,
    "Event status updated successfully.",
    event
  );
});

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateEventStatus,
};