const mongoose = require("mongoose");

const dutySchema = new mongoose.Schema(
    {
        vehicleAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VehicleAssignment",
            required: true,
        },

        startKm: {
            type: Number,
            required: true,
            min: 0,
        },

        endKm: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalKm: {
            type: Number,
            default: 0,
            min: 0,
        },

        dutyStartTime: {
            type: Date,
        },

        dutyEndTime: {
            type: Date,
        },

        status: {
            type: String,
            enum: [
                "STARTED",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "STARTED",
        },

        DA: {
            type: Number,
            default: 0,
            min: 0,
        },

        toll: {
            type: Number,
            default: 0,
            min: 0,
        },

        parking: {
            type: Number,
            default: 0,
            min: 0,
        },

        entry: {
            type: Number,
            default: 0,
            min: 0,
        },

        remarks: {
            type: String,
            trim: true,
            maxlength: 500,
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

dutySchema.index({
    vehicleAssignment: 1,
});

dutySchema.index({
    status: 1,
});

module.exports = mongoose.model(
    "Duty",
    dutySchema
);