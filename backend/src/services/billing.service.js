const dutyRepository = require("../repositories/duty.repository");
const commercialPackageRepository = require("../repositories/commercialPackage.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");

const { BILL_STATUS } = require("../constants/status");
const AppError = require("../utils/AppError");

const generateDraftBill = async (dutyId) => {

    const duty = await dutyRepository.findById(dutyId);

    if (!duty) {
        throw new AppError("Duty not found.", 404);
    }

    const assignment = await vehicleAssignmentRepository.findById(
        duty.vehicleAssignment
    );

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    if (!assignment.commercialPackage) {
        throw new AppError(
            "Commercial Package not assigned.",
            400
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

    if (
        duty.startKm == null ||
        duty.endKm == null ||
        !duty.dutyStartTime ||
        !duty.dutyEndTime
    ) {
        throw new AppError(
            "Duty is incomplete. KM or Time is missing.",
            400
        );
    }

    const totalKm = Math.max(
        0,
        duty.endKm - duty.startKm
    );

    const totalHours = Number(
        (
            (duty.dutyEndTime - duty.dutyStartTime) /
            (1000 * 60 * 60)
        ).toFixed(2)
    );

    const vendorExtraKm = Math.max(
        0,
        totalKm - commercial.vendorIncludedKm
    );

    const vendorExtraHour = Math.max(
        0,
        totalHours - commercial.vendorIncludedHours
    );

    const clientExtraKm = Math.max(
        0,
        totalKm - commercial.clientIncludedKm
    );

    const clientExtraHour = Math.max(
        0,
        totalHours - commercial.clientIncludedHours
    );

    const vendorAmount =
        commercial.vendorBaseRate +
        (vendorExtraKm * commercial.vendorExtraKmRate) +
        (vendorExtraHour * commercial.vendorExtraHourRate) +
        (duty.parkingCharges || 0) +
        (duty.tollCharges || 0) +
        (duty.entryCharges || 0) +
        (duty.daCharges || 0);

    const clientAmount =
        commercial.clientBaseRate +
        (clientExtraKm * commercial.clientExtraKmRate) +
        (clientExtraHour * commercial.clientExtraHourRate) +
        (duty.parkingCharges || 0) +
        (duty.tollCharges || 0) +
        (duty.entryCharges || 0) +
        (duty.daCharges || 0);

    return {

        assignment,

        duty,

        totalKm,

        totalHours,

        vendorBill: {
            vendorRate: commercial.vendorBaseRate,
            extraKm: vendorExtraKm,
            extraHour: vendorExtraHour,
            amount: vendorAmount,
        },

        clientBill: {
            clientRate: commercial.clientBaseRate,
            extraKm: clientExtraKm,
            extraHour: clientExtraHour,
            amount: clientAmount,
        },

        profit: clientAmount - vendorAmount,

        status: BILL_STATUS.DRAFT,
    };
};

module.exports = {
    generateDraftBill,
};