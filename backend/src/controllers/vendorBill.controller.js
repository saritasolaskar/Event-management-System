const vendorBillPdfService =
    require("../services/Pdf/vendorBillPdf.service");

const vendorBillService = require("../services/vendorBill.service");

const asyncHandler =  require("../utils/asyncHandler");
const vendorBillRepository =
    require("../repositories/vendorBill.repository");
const { successResponse,} = require("../utils/response.utils");

const createVendorBill =
    asyncHandler(async (req, res) => {

        const bill =
            await vendorBillService.createVendorBill(

                req.params.dutyId,

                req.user._id

            );

        return successResponse(

            res,

            201,

            "Vendor Bill created.",

            bill

        );

    });


const downloadVendorBillPdf =
asyncHandler(async(req,res)=>{

    const pdf =
    await vendorBillPdfService.generateVendorBillPdf(
        req.params.id
    );

    res.set({

        "Content-Type":"application/pdf",

        "Content-Disposition":

        `attachment; filename=vendor-bill-${req.params.id}.pdf`

    });

    return res.send(pdf);

});

const getVendorBills = asyncHandler(async (req, res) => {
    const bills = await vendorBillRepository.findAll();

    return successResponse(
        res,
        200,
        "Vendor bills fetched successfully.",
        bills
    );
});

module.exports = {
    createVendorBill,
    downloadVendorBillPdf,
    getVendorBills,
};