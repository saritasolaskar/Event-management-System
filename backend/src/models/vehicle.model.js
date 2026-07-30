const mongoose = require("mongoose");

const { VEHICLE_STATUS } = require("../constants/status");

const vehicleSchema = new mongoose.Schema(
  {
    vehicleNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
    },

    vehicleType: {
      type: String,
      required: true,
      enum: [
        "HATCHBACK",
        "SEDAN",
        "SUV",
        "MUV",
        "TEMPO_TRAVELLER",
        "MINI_BUS",
        "BUS",
      ],
    },

    brand: {
      type: String,
      trim: true,
    },

    model: {
      type: String,
      trim: true,
    },

    manufactureYear: {
      type: Number,
    },

    fuelType: {
      type: String,
      enum: [
        "PETROL",
        "DIESEL",
        "CNG",
        "ELECTRIC",
        "HYBRID",
      ],
    },

    seatingCapacity: {
      type: Number,
      required: true,
      min: 1,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    currentDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    rcExpiry: {
      type: Date,
    },

    insuranceExpiry: {
      type: Date,
    },

    permitExpiry: {
      type: Date,
    },

    fitnessExpiry: {
      type: Date,
    },

    pucExpiry: {
      type: Date,
    },

    gpsEnabled: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: Object.values(VEHICLE_STATUS),
      default: VEHICLE_STATUS.AVAILABLE,
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
vehicleSchema.index({ vehicleNumber: 1 });
vehicleSchema.index({ vendor: 1 });
vehicleSchema.index({ currentDriver: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ insuranceExpiry: 1 });
vehicleSchema.index({ fitnessExpiry: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);