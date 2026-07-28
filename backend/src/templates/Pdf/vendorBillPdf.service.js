const vendorBillRepository =
require("../../repositories/vendorBill.repository");

const pdfGenerator =
require("./pdfGenerator");

const generateVendorBillPdf = async (billId) => {

    const bill =
        await vendorBillRepository.findById(billId);

    if (!bill) {
        throw new Error("Vendor Bill not found.");
    }

    const vehicleAssignment =
        bill.vehicleAssignment;

    const data = {

        company: {

            name: "Transit Fleets",

            address: "Your Company Address",

            phone: "Your Phone",

            email: "info@transitfleets.com",

            gst: "GST NUMBER",

        },

        bill: {

            billNumber: bill.billNumber,

            billDate:
                bill.createdAt.toLocaleDateString(),

            vendorRate: bill.vendorRate,

            totalKm: bill.totalKm,

            totalHours: bill.totalHours,

            extraKm: bill.extraKm,

            extraHour: bill.extraHour,

            parkingCharges: bill.parkingCharges,

            tollCharges: bill.tollCharges,

            entryCharges: bill.entryCharges,

            daCharges: bill.daCharges,

            totalAmount: bill.totalAmount,

            status: bill.status,

            approvedAt: bill.approvedAt,

        },

        vendor: bill.vendor,

        event: bill.duty.event,

        duty: bill.duty,

        vehicle: vehicleAssignment.vehicle,

        driver: vehicleAssignment.driver,

        approvedBy: bill.approvedBy,

    };

    return pdfGenerator.generatePdf(
        "vendorBill",
        data
    );

};

module.exports = {
    generateVendorBillPdf,
};