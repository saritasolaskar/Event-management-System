const mongoose = require("mongoose");

const { STATUS } = require("../constants/status");

const vendorSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 150,
    },

    ownerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    gstNumber: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },

    panNumber: {
      type: String,
      trim: true,
    },

    paymentCycle: {
      type: Number,
      default: 0,
      min: 0,
    },

    commissionType: {
      type: String,
      enum: ["PERCENTAGE", "FIXED"],
      default: "PERCENTAGE",
    },

    commissionValue: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
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

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

vendorSchema.index({ companyName: 1 });
vendorSchema.index({ email: 1 });
vendorSchema.index({ gstNumber: 1 });
vendorSchema.index({ status: 1 });

module.exports = mongoose.model("Vendor", vendorSchema);