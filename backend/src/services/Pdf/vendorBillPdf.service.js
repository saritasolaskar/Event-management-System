const vendorBillRepository = require("../../repositories/vendorBill.repository");
const generatePdf = require("../../utils/pdfGenerator");

const AppError = require("../../utils/appError");

const generateVendorBillPdf = async (billId) => {

    const bill =
        await vendorBillRepository.findById(billId);

    if (!bill) {

        throw new AppError(
            "Vendor Bill not found.",
            404
        );

    }

    const data = {

        billNumber: bill.billNumber,

        vendor: bill.vendor,

        event: bill.event,

        amount: bill.totalAmount,

        package: bill.package,

        duties: bill.duties,

        generatedDate: new Date(),

    };

    return generatePdf(

        "vendorBill",

        data

    );

};

module.exports = {

    generateVendorBillPdf,

};