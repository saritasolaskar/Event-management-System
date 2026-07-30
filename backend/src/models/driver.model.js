const mongoose = require("mongoose");

const { STATUS } = require("../constants/status");

const driverSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },

        lastName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },

        email: {
            type: String,
            trim: true,
            lowercase: true,
            unique: true,
            sparse: true,
        },

        dateOfBirth: {
            type: Date,
        },

        gender: {
            type: String,
            enum: ["MALE", "FEMALE", "OTHER"],
        },

        address: {
            type: String,
            trim: true,
        },

        city: {
            type: String,
            trim: true,
        },

        state: {
            type: String,
            trim: true,
        },

        pincode: {
            type: String,
            trim: true,
        },

        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },

        currentVehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            default: null,
        },

        licenseNumber: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            unique: true,
        },

        licenseExpiry: {
            type: Date,
            required: true,
        },

        badgeNumber: {
            type: String,
            trim: true,
        },

        policeVerificationExpiry: {
            type: Date,
        },

        medicalCertificateExpiry: {
            type: Date,
        },

        joiningDate: {
            type: Date,
            default: Date.now,
        },

        rating: {
            type: Number,
            default: 5,
            min: 0,
            max: 5,
        },

        status: {
            type: String,
            enum: Object.values(STATUS),
            default: STATUS.ACTIVE,
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
driverSchema.index({ vendor: 1 });
driverSchema.index({ currentVehicle: 1 });
driverSchema.index({ licenseExpiry: 1 });
driverSchema.index({ status: 1 });

module.exports = mongoose.model("Driver", driverSchema);