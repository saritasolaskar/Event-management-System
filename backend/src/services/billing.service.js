const dutyRepository = require("../repositories/duty.repository");
const commercialPackageRepository = require("../repositories/commercialPackage.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");

const AppError = require("../utils/appError");

const generateDraftBill = async (dutyId) => {

    const duty = await dutyRepository.findById(dutyId);

    if (!duty) {
        throw new AppError("Duty not found.",404);
    }

    const assignment =
        await vehicleAssignmentRepository.findById(
            duty.vehicleAssignment
        );

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    const commercial =
        await commercialPackageRepository.findById(
            assignment.commercialPackage
        );

    if (!commercial) {
        throw new AppError(
            "Commercial Package not found.",
            404
        );
    }

    const totalKm =
        duty.endKm - duty.startKm;

    const totalHours =
        (
            duty.dutyEndTime -
            duty.dutyStartTime
        ) /
        (1000 * 60 * 60);

    let vendorExtraKm = 0;
    let vendorExtraHour = 0;

    let clientExtraKm = 0;
    let clientExtraHour = 0;

    if (
        totalKm >
        commercial.vendorIncludedKm
    ) {
        vendorExtraKm =
            totalKm -
            commercial.vendorIncludedKm;
    }

    if (
        totalHours >
        commercial.vendorIncludedHours
    ) {
        vendorExtraHour =
            totalHours -
            commercial.vendorIncludedHours;
    }

    if (
        totalKm >
        commercial.clientIncludedKm
    ) {
        clientExtraKm =
            totalKm -
            commercial.clientIncludedKm;
    }

    if (
        totalHours >
        commercial.clientIncludedHours
    ) {
        clientExtraHour =
            totalHours -
            commercial.clientIncludedHours;
    }

    const vendorAmount =
        commercial.vendorBaseRate +
        vendorExtraKm *
            commercial.vendorExtraKmRate +
        vendorExtraHour *
            commercial.vendorExtraHourRate +
        duty.parkingCharges +
        duty.tollCharges +
        duty.entryCharges +
        duty.daCharges;

    const clientAmount =
        commercial.clientBaseRate +
        clientExtraKm *
            commercial.clientExtraKmRate +
        clientExtraHour *
            commercial.clientExtraHourRate +
        duty.parkingCharges +
        duty.tollCharges +
        duty.entryCharges +
        duty.daCharges;

    return {

        assignment,

        duty,

        totalKm,

        totalHours,

        vendorBill: {

    vendorRate:
        commercial.vendorBaseRate,

    extraKm:
        vendorExtraKm,

    extraHour:
        vendorExtraHour,

    amount:
        vendorAmount,
},

        clientBill: {

    clientRate:
        commercial.clientBaseRate,

    extraKm:
        clientExtraKm,

    extraHour:
        clientExtraHour,

    amount:
        clientAmount,
},

        profit:
            clientAmount -
            vendorAmount,

        status: "DRAFT",
    };
};

module.exports = {
    generateDraftBill,
};