const mongoose = require("mongoose");

const { BILL_STATUS } = require("../constants/status");

const clientInvoiceSchema = new mongoose.Schema(
    {
        duty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Duty",
            required: true,
            unique: true,
        },

        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Client",
            required: true,
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },

        vehicleAssignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "VehicleAssignment",
            required: true,
        },

        invoiceNumber: {
            type: String,
            required: true,
            unique: true,
        },

        invoiceDate: {
            type: Date,
            default: Date.now,
        },

        dueDate: {
            type: Date,
        },

        paymentDate: Date,

        paymentMode: {
            type: String,
            enum: [
                "CASH",
                "CHEQUE",
                "NEFT",
                "RTGS",
                "UPI",
            ],
        },



        totalKm: {
            type: Number,
            required: true,
        },

        totalHours: {
            type: Number,
            required: true,
        },

        clientRate: {
            type: Number,
            required: true,
        },

        packageName: {
            type: String,
        },

        packageKm: Number,

        packageHours: Number,

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

        subtotal: {
            type: Number,
            required: true,
        },

        discount: {
            type: Number,
            default: 0,
        },

        gstPercentage: {
            type: Number,
            default: 0,
        },

        gstAmount: {
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

        remarks: {
            type: String,
            trim: true,
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

clientInvoiceSchema.index({ client: 1 });
clientInvoiceSchema.index({ event: 1 });
clientInvoiceSchema.index({ status: 1 });

module.exports = mongoose.model(
    "ClientInvoice",
    clientInvoiceSchema
);