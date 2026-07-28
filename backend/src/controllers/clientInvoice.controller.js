const clientInvoicePdfService =  require("../services/pdf/clientInvoicePdf.service");
 
const clientInvoiceService = require("../services/clientInvoice.service");

const asyncHandler = require("../utils/asyncHandler");

const { successResponse,} = require("../utils/response.utils");

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
asyncHandler(async(req,res)=>{

    const pdf =
    await clientInvoicePdfService.generateInvoicePdf(
        req.params.id
    );

    res.set({

        "Content-Type":"application/pdf",

        "Content-Disposition":

        `attachment; filename=invoice-${req.params.id}.pdf`

    });

    return res.send(pdf);

});

module.exports = {
    createClientInvoice,
    downloadInvoicePdf,
};