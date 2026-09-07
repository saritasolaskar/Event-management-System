const vendorBillRepository =
    require("../repositories/vendorBill.repository");

const clientInvoiceRepository =
    require("../repositories/clientInvoice.repository");

const AppError =
    require("../utils/AppError");

const { BILL_STATUS } =
    require("../constants/status");

/**
 * Approve Vendor Bill
 */
const approveVendorBill = async (
    id,
    remarks,
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
        bill.status !== BILL_STATUS.DRAFT &&
        bill.status !== BILL_STATUS.UNDER_REVIEW
    ) {
        throw new AppError(
            "Only draft or under-review Vendor Bills can be approved.",
            400
        );
    }

    return vendorBillRepository.updateById(
        id,
        {
            status: BILL_STATUS.APPROVED,
            approvedBy: userId,
            approvedAt: new Date(),
            remarks,
            updatedBy: userId,
        }
    );
};


/**
 * Reject Vendor Bill
 */
const rejectVendorBill = async (
    id,
    remarks,
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
        bill.status !== BILL_STATUS.DRAFT &&
        bill.status !== BILL_STATUS.UNDER_REVIEW
    ) {
        throw new AppError(
            "Only draft or under-review Vendor Bills can be rejected.",
            400
        );
    }

    return vendorBillRepository.updateById(
        id,
        {
            status: BILL_STATUS.REJECTED,
            approvedBy: userId,
            approvedAt: new Date(),
            remarks,
            updatedBy: userId,
        }
    );
};


/**
 * Share Vendor Bill
 */
const shareVendorBill = async (
    id,
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
        bill.status !== BILL_STATUS.APPROVED
    ) {
        throw new AppError(
            "Only approved Vendor Bills can be shared.",
            400
        );
    }

    return vendorBillRepository.updateById(
        id,
        {
            status: BILL_STATUS.SHARED,
            updatedBy: userId,
        }
    );
};


/**
 * Mark Vendor Bill Paid
 */
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

    if (bill.status !== BILL_STATUS.SHARED) {
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

    if (
        invoice.status !== BILL_STATUS.DRAFT &&
        invoice.status !== BILL_STATUS.UNDER_REVIEW
    ) {
        throw new AppError(
            "Only draft or under-review Client Invoices can be approved.",
            400
        );
    }

    return clientInvoiceRepository.updateById(
        id,
        {
            status: BILL_STATUS.APPROVED,
            approvedBy: userId,
            approvedAt: new Date(),
            remarks,
            updatedBy: userId,
        }
    );
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
        throw new AppError(
            "Invoice not found.",
            404
        );
    }

    if (
        invoice.status !== BILL_STATUS.DRAFT &&
        invoice.status !== BILL_STATUS.UNDER_REVIEW
    ) {
        throw new AppError(
            "Only draft or under-review Client Invoices can be rejected.",
            400
        );
    }

    return clientInvoiceRepository.updateById(
        id,
        {
            status: BILL_STATUS.REJECTED,
            approvedBy: userId,
            approvedAt: new Date(),
            remarks,
            updatedBy: userId,
        }
    );
};


/**
 * Share Client Invoice
 */
const shareClientInvoice = async (
    id,
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
        invoice.status !== BILL_STATUS.APPROVED
    ) {
        throw new AppError(
            "Only approved Client Invoices can be shared.",
            400
        );
    }

    return clientInvoiceRepository.updateById(
        id,
        {
            status: BILL_STATUS.SHARED,
            updatedBy: userId,
        }
    );
};


/**
 * Mark Client Invoice Paid
 */
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

    if (invoice.status !== BILL_STATUS.SHARED) {
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