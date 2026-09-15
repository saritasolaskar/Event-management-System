const mongoose = require("mongoose");

const commercialPackageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        vendorBaseRate: {
            type: Number,
            required: true,
            min: 0,
        },

        vendorIncludedKm: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        vendorExtraKmRate: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        vendorIncludedHours: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        vendorExtraHourRate: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        clientBaseRate: {
            type: Number,
            required: true,
            min: 0,
        },

        clientIncludedKm: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        clientExtraKmRate: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        clientIncludedHours: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        clientExtraHourRate: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
        },

        isActive: {
            type: Boolean,
            default: true,
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

commercialPackageSchema.index({ name: 1 });
commercialPackageSchema.index({ isActive: 1 });

module.exports = mongoose.model(
    "CommercialPackage",
    commercialPackageSchema
);