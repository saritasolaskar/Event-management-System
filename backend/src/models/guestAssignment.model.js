const mongoose = require("mongoose");

const guestAssignmentSchema = new mongoose.Schema(
    {
        vehicleAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VehicleAssignment",
            required: true,
        },

        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Guest",
            required: true,
        },

        pickupSequence: {
            type: Number,
            default: 1,
            min: 1,
        },

        dropSequence: {
            type: Number,
            default: 1,
            min: 1,
        },

        pickupStatus: {
            type: String,
            enum: [
                "ASSIGNED",
                "EN_ROUTE",
                "PICKED_UP",
                "VENUE_REACHED",
            ],
            default: "ASSIGNED",
        },

        returnStatus: {
            type: String,
            enum: [
                "EVENT_IN_PROGRESS",
                "RETURN_PICKUP",
                "DROPPED",
            ],
            default: "EVENT_IN_PROGRESS",
        },

        pickupTime: {
            type: Date,
        },

        venueArrivalTime: {
            type: Date,
        },

        returnPickupTime: {
            type: Date,
        },

        dropTime: {
            type: Date,
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

guestAssignmentSchema.index({ vehicleAssignment: 1 });
guestAssignmentSchema.index({ guest: 1 });
guestAssignmentSchema.index({ pickupStatus: 1 });
guestAssignmentSchema.index({ returnStatus: 1 });

module.exports = mongoose.model(
    "GuestAssignment",
    guestAssignmentSchema
);