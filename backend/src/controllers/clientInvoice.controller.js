const clientInvoicePdfService =
    require("../services/Pdf/clientInvoicePdf.service");
 
const clientInvoiceService = require("../services/clientInvoice.service");

const asyncHandler = require("../utils/asyncHandler");

const { successResponse,} = require("../utils/response.utils");
const clientInvoiceRepository =
    require("../repositories/clientInvoice.repository");
const createClientInvoice =
    asyncHandler(async (req, res) => {

        const invoice =
            await clientInvoiceService.createClientInvoice(

                req.params.dutyId,

                req.user._id

            );

        return successResponse(

            res,

            201,

            "Client Invoice created successfully.",

            invoice

        );

    });



const downloadInvoicePdf =
    asyncHandler(async (req, res) => {

        const pdf =
    await clientInvoicePdfService.generateClientInvoicePdf(
        req.params.invoiceId,
        req.user
    );

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition":
                `attachment; filename=invoice-${req.params.invoiceId}.pdf`,
        });

        return res.send(pdf);
    });


    const getClientInvoices = asyncHandler(async (req, res) => {
    const invoices = await clientInvoiceRepository.findAll();

    return successResponse(
        res,
        200,
        "Client invoices fetched successfully.",
        invoices
    );
});

module.exports = {
    createClientInvoice,
    downloadInvoicePdf,
    getClientInvoices,
};