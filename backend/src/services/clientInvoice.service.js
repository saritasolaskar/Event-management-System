const clientInvoiceRepository = require("../repositories/clientInvoice.repository");
const billingService = require("./billing.service");

const createClientInvoice = async (
    dutyId,
    userId
) => {

    const draft =
        await billingService.generateDraftBill(
            dutyId
        );

    return clientInvoiceRepository.create({

        duty: draft.duty._id,

        client:
            draft.assignment.event.client,

        event:
            draft.assignment.event._id,

        vehicleAssignment:
            draft.assignment._id,

        invoiceNumber:
            `INV-${Date.now()}`,

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
            draft.duty.parkingCharges,

        tollCharges:
            draft.duty.tollCharges,

        entryCharges:
            draft.duty.entryCharges,

        daCharges:
            draft.duty.daCharges,

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