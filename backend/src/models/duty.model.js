const mongoose = require("mongoose");

const { DUTY_STATUS } = require("../constants/status");

const dutySchema = new mongoose.Schema(
    {
        vehicleAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VehicleAssignment",
            required: true,
            unique: true,
        },

        startKm: {
            type: Number,
            required: true,
            min: 0,
        },

        endKm: {
            type: Number,
            min: 0,
        },

        startOdometerPhoto: {
            type: String,
            trim: true,
        },

        endOdometerPhoto: {
            type: String,
            trim: true,
        },

        dutyStartTime: {
            type: Date,
            default: Date.now,
        },

        dutyEndTime: {
            type: Date,
        },

        parkingCharges: {
            type: Number,
            default: 0,
            min: 0,
        },

        tollCharges: {
            type: Number,
            default: 0,
            min: 0,
        },

        entryCharges: {
            type: Number,
            default: 0,
            min: 0,
        },

        daCharges: {
            type: Number,
            default: 0,
            min: 0,
        },

        remarks: {
            type: String,
            trim: true,
        },

        status: {
            type: String,
            enum: Object.values(DUTY_STATUS),
            default: DUTY_STATUS.STARTED,
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

dutySchema.virtual("totalKm").get(function () {

    if (!this.endKm) return 0;

    return this.endKm - this.startKm;

});

dutySchema.set("toJSON", {
    virtuals: true,
});

module.exports = mongoose.model(
    "Duty",
    dutySchema
);