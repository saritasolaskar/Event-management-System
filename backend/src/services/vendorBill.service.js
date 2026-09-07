const vendorBillRepository =
require("../repositories/vendorBill.repository");

const billingService =
require("./billing.service");

const AppError =
require("../utils/AppError");

const createVendorBill = async (
dutyId,
userId
) => {

```
const existingBill =
    await vendorBillRepository.findByDuty(
        dutyId
    );

if (existingBill) {
    throw new AppError(
        "Vendor Bill already exists for this duty.",
        409
    );
}

const draft =
    await billingService.generateDraftBill(
        dutyId
    );

if (!draft.assignment.vendor) {
    throw new AppError(
        "Vendor not found for this vehicle assignment.",
        404
    );
}

return vendorBillRepository.create({

    duty:
        draft.duty._id,

    vendor:
        draft.assignment.vendor,

    vehicleAssignment:
        draft.assignment._id,

    packageName:
        draft.assignment.commercialPackage?.name,

    packageKm:
        draft.assignment.commercialPackage?.vendorIncludedKm,

    packageHours:
        draft.assignment.commercialPackage?.vendorIncludedHours,

    billDate:
        new Date(),

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
        draft.vendorBill.parkingCharges,

    tollCharges:
        draft.vendorBill.tollCharges,

    entryCharges:
        draft.vendorBill.entryCharges,

    daCharges:
        draft.vendorBill.daCharges,

    totalAmount:
        draft.vendorBill.amount,

    status:
        draft.status,

    createdBy:
        userId,

    updatedBy:
        userId,

});
```

};

module.exports = {
createVendorBill,
};
