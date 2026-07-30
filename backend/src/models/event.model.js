const mongoose = require("mongoose");

const { EVENT_STATUS } = require("../constants/status");

const eventSchema = new mongoose.Schema(
    {
        eventCode: {
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
            maxlength: 150,
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true,
        },

        venue: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Location",
            required: true,
        },

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
            validate: {
                validator: function (value) {
                    return value >= this.startDate;
                },
                message: "End date must be after start date.",
            },
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        status: {
            type: String,
            enum: Object.values(EVENT_STATUS),
            default: EVENT_STATUS.UPCOMING,
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
eventSchema.index({ eventCode: 1 });
eventSchema.index({ client: 1 });
eventSchema.index({ venue: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ status: 1 });

module.exports = mongoose.model("Event", eventSchema);