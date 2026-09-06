const vendorBillRepository = require("../repositories/vendorBill.repository");
const clientInvoiceRepository = require("../repositories/clientInvoice.repository");

const AppError = require("../utils/AppError");
const { BILL_STATUS } = require("../constants/status");

/**
 * Approve Vendor Bill
 */
const approveVendorBill = async (id, remarks, userId) => {

    const bill = await vendorBillRepository.findById(id);

    if (!bill) {
        throw new AppError("Vendor Bill not found.", 404);
    }

    if (bill.status === BILL_STATUS.APPROVED) {
        throw new AppError("Vendor Bill is already approved.", 400);
    }

    if (bill.status === BILL_STATUS.PAID) {
        throw new AppError("Paid bill cannot be approved again.", 400);
    }

    return vendorBillRepository.updateById(id, {
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
        throw new AppError("Vendor Bill not found.", 404);
    }

    if (bill.status === BILL_STATUS.REJECTED) {
        throw new AppError("Vendor Bill is already rejected.", 400);
    }

    if (bill.status === BILL_STATUS.PAID) {
        throw new AppError("Paid bill cannot be rejected.", 400);
    }

    return vendorBillRepository.updateById(id, {
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

    const bill = await vendorBillRepository.findById(id);

    if (!bill) {
        throw new AppError("Vendor Bill not found.", 404);
    }

    if (bill.status === BILL_STATUS.SHARED) {
        throw new AppError("Vendor Bill is already shared.", 400);
    }

    return vendorBillRepository.updateById(id, {
        status: BILL_STATUS.SHARED,
    });
};

/**
 * Mark Vendor Bill Paid
 */
const markVendorBillPaid = async (id) => {

    const bill = await vendorBillRepository.findById(id);

    if (!bill) {
        throw new AppError("Vendor Bill not found.", 404);
    }

    if (bill.status === BILL_STATUS.PAID) {
        throw new AppError("Vendor Bill is already paid.", 400);
    }

    return vendorBillRepository.updateById(id, {
        status: BILL_STATUS.PAID,
        paymentDate: new Date(),
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
        throw new AppError("Invoice not found.", 404);
    }

    if (invoice.status === BILL_STATUS.APPROVED) {
        throw new AppError("Invoice is already approved.", 400);
    }

    if (invoice.status === BILL_STATUS.PAID) {
        throw new AppError("Paid invoice cannot be approved.", 400);
    }

    return clientInvoiceRepository.updateById(id, {
        status: BILL_STATUS.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
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

    const invoice =
        await clientInvoiceRepository.findById(id);

    if (!invoice) {
        throw new AppError("Invoice not found.", 404);
    }

    if (invoice.status === BILL_STATUS.REJECTED) {
        throw new AppError("Invoice is already rejected.", 400);
    }

    if (invoice.status === BILL_STATUS.PAID) {
        throw new AppError("Paid invoice cannot be rejected.", 400);
    }

    return clientInvoiceRepository.updateById(id, {
        status: BILL_STATUS.REJECTED,
        approvedBy: userId,
        approvedAt: new Date(),
        remarks,
    });
};

/**
 * Share Client Invoice
 */
const shareClientInvoice = async (id) => {

    const invoice =
        await clientInvoiceRepository.findById(id);

    if (!invoice) {
        throw new AppError("Invoice not found.", 404);
    }

    if (invoice.status === BILL_STATUS.SHARED) {
        throw new AppError("Invoice is already shared.", 400);
    }

    return clientInvoiceRepository.updateById(id, {
        status: BILL_STATUS.SHARED,
    });
};

/**
 * Mark Client Invoice Paid
 */
const markClientInvoicePaid = async (id) => {

    const invoice =
        await clientInvoiceRepository.findById(id);

    if (!invoice) {
        throw new AppError("Invoice not found.", 404);
    }

    if (invoice.status === BILL_STATUS.PAID) {
        throw new AppError("Invoice is already paid.", 400);
    }

    return clientInvoiceRepository.updateById(id, {
        status: BILL_STATUS.PAID,
        paymentDate: new Date(),
    });
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