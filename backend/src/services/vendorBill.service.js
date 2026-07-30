const vendorBillRepository = require("../../repositories/vendorBill.repository");
const pdfGenerator = require("./pdfGenerator");

const config = require("../../config/env");
const AppError = require("../../utils/appError");

/**
 * Generate Vendor Bill PDF
 */
const generateVendorBillPdf = async (billId) => {

    const bill =
        await vendorBillRepository.findById(
            billId
        );

    if (!bill) {
        throw new AppError(
            "Vendor Bill not found.",
            404
        );
    }

    if (!bill.vehicleAssignment) {
        throw new AppError(
            "Vehicle Assignment not found for this bill.",
            404
        );
    }

    if (!bill.vendor) {
        throw new AppError(
            "Vendor not found.",
            404
        );
    }

    if (!bill.duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    const vehicleAssignment =
        bill.vehicleAssignment;

    const data = {

        company: {

            name:
                config.COMPANY_NAME || "Transit Fleets",

            address:
                config.COMPANY_ADDRESS || "",

            phone:
                config.COMPANY_PHONE || "",

            email:
                config.COMPANY_EMAIL || "",

            gst:
                config.COMPANY_GST || "",

        },

        bill: {

            billNumber:
                bill.billNumber,

            billDate:
                bill.createdAt.toLocaleDateString(),

            vendorRate:
                bill.vendorRate,

            totalKm:
                bill.totalKm,

            totalHours:
                bill.totalHours,

            extraKm:
                bill.extraKm,

            extraHour:
                bill.extraHour,

            parkingCharges:
                bill.parkingCharges,

            tollCharges:
                bill.tollCharges,

            entryCharges:
                bill.entryCharges,

            daCharges:
                bill.daCharges,

            totalAmount:
                bill.totalAmount,

            status:
                bill.status,

            approvedAt:
                bill.approvedAt,

        },

        vendor:
            bill.vendor,

        event:
            bill.duty.event,

        duty:
            bill.duty,

        vehicle:
            vehicleAssignment.vehicle,

        driver:
            vehicleAssignment.driver,

        approvedBy:
            bill.approvedBy,

    };

    return pdfGenerator.generatePdf(
        "vendorBill",
        data
    );

};

module.exports = {
    generateVendorBillPdf,
};