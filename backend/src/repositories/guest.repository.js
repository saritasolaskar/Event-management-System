const Guest = require("../models/guest.model");

/**
 * Create Guest
 */
const create = async (guestData) => {
  return Guest.create(guestData);
};

/**
 * Find Guest By ID
 */
const findById = async (id) => {
  return Guest.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("event", "eventCode name")
    .populate("pickupLocation", "name city")
    .populate("dropLocation", "name city");
};

/**
 * Find Guest By Code
 */
const findByGuestCode = async (guestCode) => {
  return Guest.findOne({
    guestCode,
    isDeleted: false,
  });
};

/**
 * Get Guests By Event
 */
const findByEvent = async (eventId) => {

    return Guest.find({
        event: eventId,
        isDeleted: false,
    })
    .populate("pickupLocation")
    .populate("dropLocation")
   .sort({
    firstName: 1,
    lastName: 1,
});

};

/**
 * Get All Guests
 */
const findAll = async (filter = {}) => {
  return Guest.find({
    isDeleted: false,
    ...filter,
  })
    .populate("event", "eventCode name")
    .populate("pickupLocation", "name city")
    .populate("dropLocation", "name city")
    .sort({
      createdAt: -1,
    });
};

/**
 * Update Guest
 */
const updateById = async (id, updateData) => {
  return Guest.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  );
};

/**
 * Soft Delete Guest
 */
const softDelete = async (id) => {
  return Guest.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
    },
    {
      new: true,
    }
  );
};

/**
 * Update Guest Status
 */
const updateStatus = async (id, status) => {
  return Guest.findByIdAndUpdate(
    id,
    { status },
    {
      new: true,
      runValidators: true,
    }
  );
};


module.exports = {
  create,
  findById,
  findByGuestCode,
  findByEvent,
  findAll,
  updateById,
  softDelete,
  updateStatus,
};