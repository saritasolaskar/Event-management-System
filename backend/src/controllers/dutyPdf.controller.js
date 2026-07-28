const dutySheetPdfService =
require("../services/pdf/dutySheetPdf.service");

const asyncHandler =
require("../utils/asyncHandler");

const downloadDutySheetPdf =
asyncHandler(async(req,res)=>{

    const pdf =
    await dutySheetPdfService.generateDutySheetPdf(

        req.params.id

    );

    res.set({

        "Content-Type":"application/pdf",

        "Content-Disposition":

        `attachment; filename=duty-sheet-${req.params.id}.pdf`

    });

    return res.send(pdf);

});

module.exports={

    downloadDutySheetPdf,

};