const clientInvoiceRepository =
require("../../repositories/clientInvoice.repository");
const company = require("../../config/company");
const pdfGenerator =
require("./pdfGenerator");

const generateInvoicePdf = async (
    invoiceId
) => {

    const invoice =
    await clientInvoiceRepository.findById(invoiceId);

    if (!invoice) {
        throw new Error("Client Invoice not found.");
    }

    const vehicleAssignment =
        invoice.vehicleAssignment;

    const data = {

    company,

    invoice: {

        invoiceNumber: invoice.invoiceNumber,

        invoiceDate:
        invoice.createdAt.toLocaleDateString(),

        clientRate: invoice.clientRate,

        totalKm: invoice.totalKm,

        totalHours: invoice.totalHours,

        extraKm: invoice.extraKm,

        extraHour: invoice.extraHour,

        parkingCharges: invoice.parkingCharges,

        tollCharges: invoice.tollCharges,

        entryCharges: invoice.entryCharges,

        daCharges: invoice.daCharges,

        subtotal: invoice.subtotal,

        discount: invoice.discount,

        gstAmount: invoice.gstAmount,

        totalAmount: invoice.totalAmount,

    },

    client: invoice.client,

    event: invoice.event,

    vehicle: vehicleAssignment.vehicle,

    driver: vehicleAssignment.driver,

};

    return pdfGenerator.generatePdf(
        "clientInvoice",
        data
    );

};

module.exports = {
    generateInvoicePdf,
};