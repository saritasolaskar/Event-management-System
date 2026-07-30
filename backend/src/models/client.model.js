const mongoose = require("mongoose");

const { STATUS } = require("../constants/status");

const clientSchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
            unique: true,
        },

        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },

        phone: {
            type: String,
            required: true,
            trim: true,
        },

        gstNumber: {
            type: String,
            trim: true,
            uppercase: true,
            unique: true,
            sparse: true,
        },

        panNumber: {
            type: String,
            trim: true,
            uppercase: true,
        },

        industry: {
            type: String,
            trim: true,
            default: "",
        },

        address: {
            type: String,
            trim: true,
        },

        city: {
            type: String,
            trim: true,
        },

        state: {
            type: String,
            trim: true,
        },

        country: {
            type: String,
            trim: true,
            default: "India",
        },

        pincode: {
            type: String,
            trim: true,
        },

        agreementStartDate: {
            type: Date,
        },

        agreementEndDate: {
            type: Date,
        },

        paymentTerms: {
            type: Number,
            default: 30,
        },

        creditLimit: {
            type: Number,
            default: 0,
            min: 0,
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
clientSchema.index({ companyName: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ gstNumber: 1 });
clientSchema.index({ status: 1 });

module.exports = mongoose.model("Client", clientSchema);