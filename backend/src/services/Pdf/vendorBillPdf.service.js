const vendorBillRepository = require("../../repositories/vendorBill.repository");
const pdfGenerator = require("../pdfGenerator");

const AppError = require("../../utils/appError");

const COMPANY = {
    name: "Transit Fleets",
    address: process.env.COMPANY_ADDRESS || "Your Company Address",
    phone: process.env.COMPANY_PHONE || "Your Phone",
    email: process.env.COMPANY_EMAIL || "info@transitfleets.com",
};

const generateVendorBillPdf = async (billId) => {

    const bill = await vendorBillRepository.findById(billId);

    if (!bill) {
        throw new AppError("Vendor Bill not found.", 404);
    }

    const data = {

        company: COMPANY,

        bill,

        vendor: bill.vendor,

        duty: bill.duty,

        event: bill.duty?.event,

        vehicleAssignment: bill.vehicleAssignment,

        package: {
            name: bill.packageName,
            km: bill.packageKm,
            hours: bill.packageHours,
        },

        generatedAt: new Date(),
    };

    return pdfGenerator.generatePdf(
        "vendorBill",
        data
    );
};

module.exports = {
    generateVendorBillPdf,
};