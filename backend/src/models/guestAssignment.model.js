const mongoose = require("mongoose");

const {
    PICKUP_STATUS,
    RETURN_STATUS,
} = require("../constants/status");

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
    enum: Object.values(PICKUP_STATUS),
    default: PICKUP_STATUS.PENDING,
},

        returnStatus: {
    type: String,
    enum: Object.values(RETURN_STATUS),
    default: RETURN_STATUS.NOT_STARTED,
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

guestAssignmentSchema.index(
    { guest: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isDeleted: false,
        },
    }
);

module.exports = mongoose.model(
    "GuestAssignment",
    guestAssignmentSchema
);