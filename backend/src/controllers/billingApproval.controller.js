const service =
    require("../services/billingApproval.service");

const asyncHandler =
    require("../utils/asyncHandler");

const {
    successResponse
} = require("../utils/response.utils");


const approveVendorBill =
    asyncHandler(async (req, res) => {

        const bill =
            await service.approveVendorBill(
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


const rejectVendorBill =
    asyncHandler(async (req, res) => {

        const bill =
            await service.rejectVendorBill(
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


const shareVendorBill =
    asyncHandler(async (req, res) => {

        const bill =
            await service.shareVendorBill(
                req.params.id,
                req.user._id
            );

        return successResponse(
            res,
            200,
            "Vendor Bill shared successfully.",
            bill
        );
    });


const markVendorBillPaid = async (
    id,
    paymentMode,
    paymentReference,
    userId
) => {
    const bill =
        await vendorBillRepository.findById(id);

    if (!bill) {
        throw new AppError(
            "Vendor Bill not found.",
            404
        );
    }

    if (
        bill.status !== BILL_STATUS.SHARED
    ) {
        throw new AppError(
            "Only shared Vendor Bills can be marked as paid.",
            400
        );
    }

    return vendorBillRepository.updateById(
        id,
        {
            status: BILL_STATUS.PAID,
            paymentDate: new Date(),
            paymentMode,
            paymentReference,
            updatedBy: userId,
        }
    );
};


const approveClientInvoice =
    asyncHandler(async (req, res) => {

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


const rejectClientInvoice =
    asyncHandler(async (req, res) => {

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


const shareClientInvoice =
    asyncHandler(async (req, res) => {

        const invoice =
            await service.shareClientInvoice(
                req.params.id,
                req.user._id
            );

        return successResponse(
            res,
            200,
            "Client Invoice shared successfully.",
            invoice
        );
    });


const markClientInvoicePaid = async (
    id,
    paymentMode,
    paymentReference,
    userId
) => {
    const invoice =
        await clientInvoiceRepository.findById(id);

    if (!invoice) {
        throw new AppError(
            "Invoice not found.",
            404
        );
    }

    if (
        invoice.status !== BILL_STATUS.SHARED
    ) {
        throw new AppError(
            "Only shared Client Invoices can be marked as paid.",
            400
        );
    }

    return clientInvoiceRepository.updateById(
        id,
        {
            status: BILL_STATUS.PAID,
            paymentDate: new Date(),
            paymentMode,
            paymentReference,
            updatedBy: userId,
        }
    );
};


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