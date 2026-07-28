const billingService = require("../services/billing.service");

const asyncHandler = require("../utils/asyncHandler");

const { successResponse } =
require("../utils/response.utils");

const generateDraftBill =
asyncHandler(async(req,res)=>{

    const draft =
        await billingService.generateDraftBill(
            req.params.dutyId
        );

    return successResponse(
        res,
        200,
        "Draft bill generated successfully.",
        draft
    );

});

module.exports={
    generateDraftBill,
};