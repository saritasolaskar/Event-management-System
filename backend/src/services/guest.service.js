const guestRepository = require("../repositories/guest.repository");
const eventRepository = require("../repositories/event.repository");
const locationRepository = require("../repositories/location.repository");

const AppError = require("../utils/appError");

/**
 * Create Guest
 */
const createGuest = async (guestData, userId) => {
  const event = await eventRepository.findById(guestData.event);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  const pickupLocation = await locationRepository.findById(
    guestData.pickupLocation
  );

  if (!pickupLocation) {
    throw new AppError("Pickup location not found.", 404);
  }

  const dropLocation = await locationRepository.findById(
    guestData.dropLocation
  );

  if (!dropLocation) {
    throw new AppError("Drop location not found.", 404);
  }

  guestData.createdBy = userId;
  guestData.updatedBy = userId;

  return await guestRepository.create(guestData);
};

/**
 * Get All Guests
 */
const getAllGuests = async () => {
  return await guestRepository.findAll();
};

/**
 * Get Guests By Event
 */
const getGuestsByEvent = async (eventId) => {
  return await guestRepository.findByEvent(eventId);
};

/**
 * Get Guest By ID
 */
const getGuestById = async (guestId) => {
  const guest = await guestRepository.findById(guestId);

  if (!guest) {
    throw new AppError("Guest not found.", 404);
  }

  return guest;
};

/**
 * Update Guest
 */
const updateGuest = async (guestId, updateData, userId) => {
  const guest = await guestRepository.findById(guestId);

  if (!guest) {
    throw new AppError("Guest not found.", 404);
  }

  updateData.updatedBy = userId;

  return await guestRepository.updateById(
    guestId,
    updateData
  );
};

/**
 * Delete Guest
 */
const deleteGuest = async (guestId) => {
  const guest = await guestRepository.findById(guestId);

  if (!guest) {
    throw new AppError("Guest not found.", 404);
  }

  await guestRepository.softDelete(guestId);
};

/**
 * Update Guest Status
 */
const updateGuestStatus = async (guestId, status) => {
  const guest = await guestRepository.findById(guestId);

  if (!guest) {
    throw new AppError("Guest not found.", 404);
  }

  return await guestRepository.updateStatus(
    guestId,
    status
  );
};

module.exports = {
  createGuest,
  getAllGuests,
  getGuestsByEvent,
  getGuestById,
  updateGuest,
  deleteGuest,
  updateGuestStatus,
};