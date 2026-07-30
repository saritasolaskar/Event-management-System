const mongoose = require("mongoose");

const { STATUS } = require("../constants/status");

const locationSchema = new mongoose.Schema(
    {
        locationCode: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            unique: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },

        city: {
            type: String,
            required: true,
            trim: true,
        },

        state: {
            type: String,
            required: true,
            trim: true,
        },

        country: {
            type: String,
            default: "India",
            trim: true,
        },

        pincode: {
            type: String,
            trim: true,
        },

        latitude: {
            type: Number,
        },

        longitude: {
            type: Number,
        },

        landmark: {
            type: String,
            trim: true,
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
locationSchema.index({ locationCode: 1 });
locationSchema.index({ city: 1 });
locationSchema.index({ status: 1 });
locationSchema.index({ latitude: 1, longitude: 1 });

module.exports = mongoose.model("Location", locationSchema);