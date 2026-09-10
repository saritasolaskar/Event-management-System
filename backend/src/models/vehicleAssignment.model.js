const mongoose = require("mongoose");

const vehicleAssignmentSchema = new mongoose.Schema(
    {
        assignmentCode: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },

        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },

        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true,
        },

        commercialPackage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CommercialPackage",
            required: true,
        },

        commercialPackageSnapshot: {
            name: {
                type: String,
                trim: true,
                maxlength: 150,
            },

            vendorBaseRate: {
                type: Number,
                min: 0,
            },

            vendorIncludedKm: {
                type: Number,
                min: 0,
            },

            vendorExtraKmRate: {
                type: Number,
                min: 0,
            },

            vendorIncludedHours: {
                type: Number,
                min: 0,
            },

            vendorExtraHourRate: {
                type: Number,
                min: 0,
            },

            clientBaseRate: {
                type: Number,
                min: 0,
            },

            clientIncludedKm: {
                type: Number,
                min: 0,
            },

            clientExtraKmRate: {
                type: Number,
                min: 0,
            },

            clientIncludedHours: {
                type: Number,
                min: 0,
            },

            clientExtraHourRate: {
                type: Number,
                min: 0,
            },
        },

        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vehicle",
            required: true,
        },

        driver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Driver",
            required: true,
        },

        reportingLocation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Location",
        },

        reportingTime: {
            type: Date,
        },

        dutyStartTime: {
            type: Date,
        },

        dutyEndTime: {
            type: Date,
        },

        startKm: {
            type: Number,
            default: 0,
            min: 0,
        },

        endKm: {
            type: Number,
            default: 0,
            min: 0,
        },

        totalKm: {
            type: Number,
            default: 0,
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

        remarks: {
            type: String,
            trim: true,
            maxlength: 500,
        },

        status: {
            type: String,
            enum: [
                "ASSIGNED",
                "ON_DUTY",
                "COMPLETED",
                "CANCELLED",
            ],
            default: "ASSIGNED",
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

vehicleAssignmentSchema.index({ event: 1 });
vehicleAssignmentSchema.index({ vendor: 1 });
vehicleAssignmentSchema.index({ driver: 1 });
vehicleAssignmentSchema.index({ vehicle: 1 });
vehicleAssignmentSchema.index({ status: 1 });

module.exports = mongoose.model(
    "VehicleAssignment",
    vehicleAssignmentSchema
);