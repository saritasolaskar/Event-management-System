const vendorBillRepository = require("../repositories/vendorBill.repository");
const clientInvoiceRepository = require("../repositories/clientInvoice.repository");

const AppError = require("../utils/appError");

const { BILL_STATUS } = require("../constants/status");

/**
 * Approve Vendor Bill
 */
const approveVendorBill = async (id, remarks, userId) => {

    const bill = await vendorBillRepository.findById(id);

    if (!bill) {
        throw new AppError("Vendor Bill not found.",404);
    }

    if (bill.status === BILL_STATUS.APPROVED) {
        throw new AppError("Vendor Bill already approved.",400);
    }

    return vendorBillRepository.updateById(id,{
        status: BILL_STATUS.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
        remarks,
    });

};

/**
 * Reject Vendor Bill
 */
const rejectVendorBill = async (id, remarks, userId) => {

    const bill = await vendorBillRepository.findById(id);

    if (!bill) {
        throw new AppError("Vendor Bill not found.",404);
    }

    return vendorBillRepository.updateById(id,{
        status: BILL_STATUS.REJECTED,
        approvedBy: userId,
        approvedAt: new Date(),
        remarks,
    });

};

/**
 * Share Vendor Bill
 */
const shareVendorBill = async (id) => {

    return vendorBillRepository.updateById(id,{
        status: BILL_STATUS.SHARED,
    });

};

/**
 * Mark Vendor Bill Paid
 */
const markVendorBillPaid = async (id) => {

    return vendorBillRepository.updateById(id,{
        status: BILL_STATUS.PAID,
    });

};

/**
 * Approve Client Invoice
 */
const approveClientInvoice = async (
    id,
    remarks,
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

    return clientInvoiceRepository.updateById(id,{
        status:BILL_STATUS.APPROVED,
        approvedBy:userId,
        approvedAt:new Date(),
        remarks,
    });

};

/**
 * Reject Client Invoice
 */
const rejectClientInvoice = async (
    id,
    remarks,
    userId
) => {

    return clientInvoiceRepository.updateById(id,{
        status:BILL_STATUS.REJECTED,
        approvedBy:userId,
        approvedAt:new Date(),
        remarks,
    });

};

/**
 * Share Client Invoice
 */
const shareClientInvoice = async (id)=>{

    return clientInvoiceRepository.updateById(id,{
        status:BILL_STATUS.SHARED,
    });

};

/**
 * Mark Client Invoice Paid
 */
const markClientInvoicePaid = async(id)=>{

    return clientInvoiceRepository.updateById(id,{
        status:BILL_STATUS.PAID,
    });

};

module.exports={
    approveVendorBill,
    rejectVendorBill,
    shareVendorBill,
    markVendorBillPaid,
    approveClientInvoice,
    rejectClientInvoice,
    shareClientInvoice,
    markClientInvoicePaid,
};