
const mongoose = require("mongoose");

const {
    TRIP_STAGE,
} = require("../constants/status");

const trackingSchema = new mongoose.Schema(
    {
        duty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Duty",
            required: true,
            index: true,
        },

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
            index: true,
        },

        vehicleAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VehicleAssignment",
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
            default: TRIP_STAGE.NOT_STARTED,
        },

        recordedAt: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    {
        timestamps: true,
    }
);

trackingSchema.index({
    duty: 1,
    recordedAt: -1,
});

trackingSchema.index({
    driver: 1,
    recordedAt: -1,
});

trackingSchema.index({
    vehicleAssignment: 1,
    recordedAt: -1,
});

module.exports = mongoose.model(
    "Tracking",
    trackingSchema
);
