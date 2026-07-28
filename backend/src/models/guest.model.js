const mongoose = require("mongoose");

const { GUEST_STATUS } = require("../constants/status");

const guestSchema = new mongoose.Schema(
  {
    guestCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    lastName: {
      type: String,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"],
    },

    pickupLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    dropLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true,
    },

    hotelName: {
      type: String,
      trim: true,
    },

    roomNumber: {
      type: String,
      trim: true,
    },

    flightNumber: {
      type: String,
      trim: true,
    },

    arrivalTime: {
      type: Date,
    },

    departureTime: {
      type: Date,
    },

    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: Object.values(GUEST_STATUS),
      default: GUEST_STATUS.PENDING,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
guestSchema.index({ guestCode: 1 });
guestSchema.index({ event: 1 });
guestSchema.index({ phone: 1 });
guestSchema.index({ status: 1 });
guestSchema.index({ pickupLocation: 1 });
guestSchema.index({ dropLocation: 1 });

module.exports = mongoose.model("Guest", guestSchema);