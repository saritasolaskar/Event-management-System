const dutyRepository = require("../repositories/duty.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");

const AppError = require("../utils/appError");

const { DUTY_STATUS } = require("../constants/status");

/**
 * Start Duty
 */
const startDuty = async (data, userId) => {

    const assignment =
        await vehicleAssignmentRepository.findById(
            data.vehicleAssignment
        );

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    const existingDuty =
        await dutyRepository.findByVehicleAssignment(
            data.vehicleAssignment
        );

    if (existingDuty) {
        throw new AppError(
            "Duty already started for this assignment.",
            400
        );
    }

    data.createdBy = userId;
    data.updatedBy = userId;

    return await dutyRepository.create(data);
};

/**
 * Get Duty
 */
const getDuty = async (id) => {

    const duty = await dutyRepository.findById(id);

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    return duty;
};

/**
 * Complete Duty
 */
const completeDuty = async (
    id,
    data,
    userId
) => {

    const duty = await dutyRepository.findById(id);

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    if (data.endKm < duty.startKm) {
        throw new AppError(
            "End KM cannot be less than Start KM.",
            400
        );
    }

    if (duty.status === DUTY_STATUS.COMPLETED) {
    throw new AppError(
        "Duty has already been completed.",
        400
    );
}

    data.status = DUTY_STATUS.COMPLETED;
    data.dutyEndTime = new Date();
    data.updatedBy = userId;

    return await dutyRepository.updateById(
        id,
        data
    );
};

/**
 * Update Expenses
 */
const updateExpenses = async (
    id,
    expenses,
    userId
) => {

    const duty = await dutyRepository.findById(id);

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    expenses.updatedBy = userId;

    return await dutyRepository.updateById(
        id,
        expenses
    );
};

module.exports = {
    startDuty,
    getDuty,
    completeDuty,
    updateExpenses,
};