const service = require("../services/billingApproval.service");

const asyncHandler = require("../utils/asyncHandler");

const { successResponse } = require("../utils/response.utils");

const approveVendorBill = asyncHandler(async(req,res)=>{

    const bill = await service.approveVendorBill(
        req.params.id,
        req.body.remarks,
        req.user._id
    );

    return successResponse(
        res,
        200,
        "Vendor Bill approved successfully.",
        bill
    );

});

const rejectVendorBill = asyncHandler(async(req,res)=>{

    const bill = await service.rejectVendorBill(
        req.params.id,
        req.body.remarks,
        req.user._id
    );

    return successResponse(
        res,
        200,
        "Vendor Bill rejected successfully.",
        bill
    );

});

const shareVendorBill = asyncHandler(async(req,res)=>{

    const bill =
    await service.shareVendorBill(req.params.id);

    return successResponse(
        res,
        200,
        "Vendor Bill shared successfully.",
        bill
    );

});

const markVendorBillPaid = asyncHandler(async(req,res)=>{

    const bill =
    await service.markVendorBillPaid(req.params.id);

    return successResponse(
        res,
        200,
        "Vendor Bill marked paid.",
        bill
    );

});

const approveClientInvoice = asyncHandler(async(req,res)=>{

    const invoice =
    await service.approveClientInvoice(
        req.params.id,
        req.body.remarks,
        req.user._id
    );

    return successResponse(
        res,
        200,
        "Client Invoice approved successfully.",
        invoice
    );

});

const rejectClientInvoice = asyncHandler(async(req,res)=>{

    const invoice =
    await service.rejectClientInvoice(
        req.params.id,
        req.body.remarks,
        req.user._id
    );

    return successResponse(
        res,
        200,
        "Client Invoice rejected successfully.",
        invoice
    );

});

const shareClientInvoice = asyncHandler(async(req,res)=>{

    const invoice =
    await service.shareClientInvoice(req.params.id);

    return successResponse(
        res,
        200,
        "Client Invoice shared successfully.",
        invoice
    );

});

const markClientInvoicePaid = asyncHandler(async(req,res)=>{

    const invoice =
    await service.markClientInvoicePaid(req.params.id);

    return successResponse(
        res,
        200,
        "Client Invoice marked paid.",
        invoice
    );

});

module.exports = {
    approveVendorBill,
    rejectVendorBill,
    shareVendorBill,
    markVendorBillPaid,
    approveClientInvoice,
    rejectClientInvoice,
    shareClientInvoice,
    markClientInvoicePaid,
};