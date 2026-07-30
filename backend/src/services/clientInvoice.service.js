const clientInvoiceRepository = require("../repositories/clientInvoice.repository");
const billingService = require("./billing.service");
const dutyRepository = require("../repositories/duty.repository");

const AppError = require("../utils/appError");

const createClientInvoice = async (
    dutyId,
    userId
) => {

    const existingInvoice =
        await clientInvoiceRepository.findByDuty(dutyId);

    if (existingInvoice) {
        throw new AppError(
            "Client Invoice already exists for this duty.",
            409
        );
    }

    const draft =
        await billingService.generateDraftBill(
            dutyId
        );

    const duty =
        await dutyRepository.findById(dutyId);

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    return clientInvoiceRepository.create({

        duty: duty._id,

        client: duty.event.client,

        event: duty.event._id,

        vehicleAssignment:
            draft.assignment._id,

        invoiceNumber:
            `INV-${Date.now()}`,

        invoiceDate:
            new Date(),

        totalKm:
            draft.totalKm,

        totalHours:
            draft.totalHours,

        clientRate:
            draft.clientBill.clientRate,

        extraKm:
            draft.clientBill.extraKm,

        extraHour:
            draft.clientBill.extraHour,

        parkingCharges:
            draft.duty.parkingCharges || 0,

        tollCharges:
            draft.duty.tollCharges || 0,

        entryCharges:
            draft.duty.entryCharges || 0,

        daCharges:
            draft.duty.daCharges || 0,

        subtotal:
            draft.clientBill.amount,

        discount: 0,

        gstPercentage: 0,

        gstAmount: 0,

        totalAmount:
            draft.clientBill.amount,

        createdBy: userId,

        updatedBy: userId,

    });

};

module.exports = {
    createClientInvoice,
};