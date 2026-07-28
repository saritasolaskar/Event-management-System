const mongoose = require("mongoose");

const { BILL_STATUS } = require("../constants/status");

const vendorBillSchema = new mongoose.Schema(
    {
        duty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Duty",
            required: true,
            unique: true,
        },

        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },

        vehicleAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VehicleAssignment",
            required: true,
        },

        billDate: {
            type: Date,
            default: Date.now,
        },

        totalKm: {
            type: Number,
            required: true,
        },

        totalHours: {
            type: Number,
            required: true,
        },

        vendorRate: {
            type: Number,
            required: true,
        },

        extraKm: {
            type: Number,
            default: 0,
        },

        extraHour: {
            type: Number,
            default: 0,
        },

        parkingCharges: {
            type: Number,
            default: 0,
        },

        tollCharges: {
            type: Number,
            default: 0,
        },

        entryCharges: {
            type: Number,
            default: 0,
        },

        daCharges: {
            type: Number,
            default: 0,
        },

        totalAmount: {
            type: Number,
            required: true,
        },



        status: {
            type: String,
            enum: Object.values(BILL_STATUS),
            default: BILL_STATUS.DRAFT,
        },

        approvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },

        approvedAt: Date,

        paymentDate: {
            type: Date,
        },
        paymentMode: {
            type: String,
            enum: [
                "CASH",
                "CHEQUE",
                "UPI",
                "NEFT",
                "RTGS",
            ],
        },
        remarks: {
            type: String,
            trim: true,
        },

        paymentReference: {
            type: String,
            trim: true,
        },

        currency: {
            type: String,
            default: "INR",
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

        packageName: {
            type: String,
        },

        packageKm: Number,

        packageHours: Number,
    },
    {
        timestamps: true,
    }




);

module.exports =
    mongoose.model(
        "VendorBill",
        vendorBillSchema
    );