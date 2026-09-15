const mongoose = require("mongoose");

const {
    TRIP_STAGE,
} = require("../constants/status");

const driverTrackingSchema = new mongoose.Schema(
    {
        duty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Duty",
            required: true,
            index: true,
        },

        latitude: {
            type: Number,
            required: true,
            min: -90,
            max: 90,
        },

        longitude: {
            type: Number,
            required: true,
            min: -180,
            max: 180,
        },

        accuracy: {
            type: Number,
            default: 0,
            min: 0,
        },

        speed: {
            type: Number,
            default: 0,
            min: 0,
        },

        heading: {
            type: Number,
            default: 0,
            min: 0,
            max: 360,
        },

        stage: {
            type: String,
            enum: Object.values(TRIP_STAGE),
            required: true,
        },

        trackedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

driverTrackingSchema.index({
    duty: 1,
    trackedAt: -1,
});

module.exports = mongoose.model(
    "DriverTracking",
    driverTrackingSchema
);