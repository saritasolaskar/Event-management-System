const vendorBillRepository =
require("../repositories/vendorBill.repository");

const billingService =
require("./billing.service");

const createVendorBill =
async(dutyId,userId)=>{

    const draft =
    await billingService.generateDraftBill(
        dutyId
    );

    return vendorBillRepository.create({

        duty:draft.duty._id,

        vendor:
        draft.assignment.vendor,

        vehicleAssignment:
        draft.assignment._id,

        billNumber:
        `VB-${Date.now()}`,

        totalKm:
        draft.totalKm,

        totalHours:
        draft.totalHours,

        vendorRate:
        draft.vendorBill.vendorRate,

        extraKm:
        draft.vendorBill.extraKm,

        extraHour:
        draft.vendorBill.extraHour,

        parkingCharges:
        draft.duty.parkingCharges,

        tollCharges:
        draft.duty.tollCharges,

        entryCharges:
        draft.duty.entryCharges,

        daCharges:
        draft.duty.daCharges,

        totalAmount:
        draft.vendorBill.amount,

        createdBy:userId,
        updatedBy:userId,
    });

};

module.exports={
    createVendorBill,
};