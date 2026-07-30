const mongoose = require("mongoose");

const TRACKING_STAGE = Object.freeze({
    STARTED: "STARTED",
    EN_ROUTE_PICKUP: "EN_ROUTE_PICKUP",
    AT_PICKUP: "AT_PICKUP",
    EN_ROUTE_DROP: "EN_ROUTE_DROP",
    AT_DROP: "AT_DROP",
    COMPLETED: "COMPLETED",
});

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
            enum: Object.values(TRACKING_STAGE),
            default: TRACKING_STAGE.STARTED,
        },

        recordedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

/*
|--------------------------------------------------------------------------
| Indexes
|--------------------------------------------------------------------------
*/

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