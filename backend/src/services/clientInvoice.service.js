const crypto = require("crypto");

const clientInvoiceRepository =
    require("../repositories/clientInvoice.repository");

const billingService =
    require("./billing.service");

const dutyRepository =
    require("../repositories/duty.repository");

const AppError =
    require("../utils/AppError");


const generateInvoiceNumber = () => {

    const timestamp =
        Date.now().toString(36).toUpperCase();

    const random =
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase();

    return `INV-${timestamp}-${random}`;
};


/**
 * Create Client Invoice
 */
const createClientInvoice = async (
    dutyId,
    userId
) => {

    const existingInvoice =
        await clientInvoiceRepository.findByDuty(
            dutyId
        );

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
        await dutyRepository.findById(
            dutyId
        );

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    const event =
        duty.vehicleAssignment?.event;

    if (!event) {
        throw new AppError(
            "Event not found for this duty.",
            404
        );
    }

    if (!event.client) {
        throw new AppError(
            "Client not found for this event.",
            404
        );
    }

    try {

        return await clientInvoiceRepository.create({

            duty:
                duty._id,

            client:
                event.client,

            event:
                event._id,

            vehicleAssignment:
                draft.assignment._id,

            packageName:
                draft.assignment
                    .commercialPackageSnapshot
                    ?.name,

            packageKm:
                draft.assignment
                    .commercialPackageSnapshot
                    ?.clientIncludedKm,

            packageHours:
                draft.assignment
                    .commercialPackageSnapshot
                    ?.clientIncludedHours,

            invoiceNumber:
                generateInvoiceNumber(),

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
                draft.clientBill.parkingCharges,

            tollCharges:
                draft.clientBill.tollCharges,

            entryCharges:
                draft.clientBill.entryCharges,

            daCharges:
                draft.clientBill.daCharges,

            subtotal:
                draft.clientBill.amount,

            discount:
                0,

            gstPercentage:
                0,

            gstAmount:
                0,

            totalAmount:
                draft.clientBill.amount,

            createdBy:
                userId,

            updatedBy:
                userId,

        });

    } catch (error) {

        // Unique duty/invoice number protection
        if (error?.code === 11000) {

            if (
                error.keyPattern?.duty ||
                error.keyValue?.duty
            ) {
                throw new AppError(
                    "Client Invoice already exists for this duty.",
                    409
                );
            }

            if (
                error.keyPattern?.invoiceNumber ||
                error.keyValue?.invoiceNumber
            ) {
                throw new AppError(
                    "Invoice number collision occurred. Please try again.",
                    409
                );
            }
        }

        throw error;
    }
};


module.exports = {
    createClientInvoice,
};