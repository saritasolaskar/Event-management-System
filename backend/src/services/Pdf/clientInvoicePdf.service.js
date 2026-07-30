const clientInvoiceRepository =
require("../../repositories/clientInvoice.repository");

const pdfGenerator =
require("./pdfGenerator");

const config =
require("../../config/env");

const AppError =
require("../../utils/appError");

/**
 * Generate Client Invoice PDF
 */
const generateClientInvoicePdf = async (
    invoiceId
) => {

    const invoice =
        await clientInvoiceRepository.findById(
            invoiceId
        );

    if (!invoice) {
        throw new AppError(
            "Client Invoice not found.",
            404
        );
    }

    if (!invoice.client) {
        throw new AppError(
            "Client not found.",
            404
        );
    }

    if (!invoice.event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    const company = {

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

    };

    const data = {

        company,

        invoice: {

            invoiceNumber:
                invoice.invoiceNumber,

            invoiceDate:
                invoice.createdAt.toLocaleDateString(),

            packageType:
                invoice.packageType,

            packageRate:
                invoice.packageRate,

            totalKm:
                invoice.totalKm,

            totalHours:
                invoice.totalHours,

            extraKm:
                invoice.extraKm,

            extraHour:
                invoice.extraHour,

            parkingCharges:
                invoice.parkingCharges,

            tollCharges:
                invoice.tollCharges,

            entryCharges:
                invoice.entryCharges,

            daCharges:
                invoice.daCharges,

            totalAmount:
                invoice.totalAmount,

            status:
                invoice.status,

            approvedAt:
                invoice.approvedAt,

        },

        client:
            invoice.client,

        event:
            invoice.event,

        approvedBy:
            invoice.approvedBy,
                    generatedAt:
            new Date().toLocaleString(),

    };

    return pdfGenerator.generatePdf(
        "clientInvoice",
        data
    );

};

module.exports = {
    generateClientInvoicePdf,
};