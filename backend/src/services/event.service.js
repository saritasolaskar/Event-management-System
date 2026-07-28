const eventRepository = require("../repositories/event.repository");

const clientRepository = require("../repositories/client.repository");
const locationRepository = require("../repositories/location.repository");

const AppError = require("../utils/appError");

/**
 * Create Event
 */
const createEvent = async (eventData, userId) => {
  // Check Event Code
  const existingEvent = await eventRepository.findByEventCode(
    eventData.eventCode
  );

  if (existingEvent) {
    throw new AppError("Event code already exists.", 409);
  }

  // Check Client
  const client = await clientRepository.findById(eventData.client);

  if (!client) {
    throw new AppError("Client not found.", 404);
  }

  // Check Venue
  const venue = await locationRepository.findById(eventData.venue);

  if (!venue) {
    throw new AppError("Venue not found.", 404);
  }

  // Date Validation
  if (new Date(eventData.startDate) > new Date(eventData.endDate)) {
    throw new AppError(
      "Start date cannot be greater than end date.",
      400
    );
  }

  eventData.createdBy = userId;
  eventData.updatedBy = userId;

  return await eventRepository.create(eventData);
};

/**
 * Get All Events
 */
const getAllEvents = async () => {
  return await eventRepository.findAll();
};

/**
 * Get Event By ID
 */
const getEventById = async (eventId) => {
  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  return event;
};

/**
 * Update Event
 */
const updateEvent = async (
  eventId,
  updateData,
  userId
) => {
  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  if (
    updateData.eventCode &&
    updateData.eventCode !== event.eventCode
  ) {
    const existingEvent =
      await eventRepository.findByEventCode(updateData.eventCode);

    if (existingEvent) {
      throw new AppError("Event code already exists.", 409);
    }
  }

  if (updateData.client) {
    const client = await clientRepository.findById(
      updateData.client
    );

    if (!client) {
      throw new AppError("Client not found.", 404);
    }
  }

  if (updateData.venue) {
    const venue = await locationRepository.findById(
      updateData.venue
    );

    if (!venue) {
      throw new AppError("Venue not found.", 404);
    }
  }

  if (
    updateData.startDate &&
    updateData.endDate &&
    new Date(updateData.startDate) >
      new Date(updateData.endDate)
  ) {
    throw new AppError(
      "Start date cannot be greater than end date.",
      400
    );
  }

  updateData.updatedBy = userId;

  return await eventRepository.updateById(
    eventId,
    updateData
  );
};

/**
 * Delete Event
 */
const deleteEvent = async (eventId) => {
  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  await eventRepository.softDelete(eventId);
};

/**
 * Update Event Status
 */
const updateEventStatus = async (
  eventId,
  status
) => {
  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  return await eventRepository.updateStatus(
    eventId,
    status
  );
};

module.exports = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  updateEventStatus,
};