const guestManifestPdfService =
require("../services/pdf/guestManifestPdf.service");

const asyncHandler =
require("../utils/asyncHandler");

const downloadGuestManifestPdf =
asyncHandler(async(req,res)=>{

    const pdf =
    await guestManifestPdfService.generateGuestManifestPdf(

        req.params.id

    );

    res.set({

        "Content-Type":"application/pdf",

        "Content-Disposition":

        `attachment; filename=guest-manifest-${req.params.id}.pdf`

    });

    return res.send(pdf);

});

module.exports={

    downloadGuestManifestPdf,

};