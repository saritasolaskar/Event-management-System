const mongoose = require("mongoose");

const { VEHICLE_ASSIGNMENT_STATUS } = require("../constants/status");

const vehicleAssignmentSchema = new mongoose.Schema(
  {
    assignmentCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: true,
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    reportingLocation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
    },

    reportingTime: {
      type: Date,
    },

    dutyStartTime: Date,

    dutyEndTime: Date,

    startKm: {
      type: Number,
      default: 0,
    },

    endKm: {
      type: Number,
      default: 0,
    },

    totalKm: {
      type: Number,
      default: 0,
    },

    startOdometerPhoto: String,

    endOdometerPhoto: String,

    remarks: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: Object.values(VEHICLE_ASSIGNMENT_STATUS),
      default: VEHICLE_ASSIGNMENT_STATUS.ASSIGNED,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

vehicleAssignmentSchema.index({ event: 1 });
vehicleAssignmentSchema.index({ vendor: 1 });
vehicleAssignmentSchema.index({ driver: 1 });
vehicleAssignmentSchema.index({ vehicle: 1 });
vehicleAssignmentSchema.index({ status: 1 });

module.exports = mongoose.model(
  "VehicleAssignment",
  vehicleAssignmentSchema
);