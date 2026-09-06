const dutyRepository = require("../repositories/duty.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");

const notificationService = require("./notification.service");
const auditLogService = require("./auditLog.service");

const AppError = require("../utils/AppError");

const {
    DUTY_STATUS,
    VEHICLE_ASSIGNMENT_STATUS,
} = require("../constants/status");

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

    if (
        assignment.status !==
        VEHICLE_ASSIGNMENT_STATUS.ASSIGNED
    ) {
        throw new AppError(
            "Vehicle Assignment is not available to start duty.",
            400
        );
    }

    const existingDuty =
        await dutyRepository.findByVehicleAssignment(
            data.vehicleAssignment
        );

    if (
        existingDuty &&
        existingDuty.status !== DUTY_STATUS.COMPLETED
    ) {
        throw new AppError(
            "Duty already started for this assignment.",
            400
        );
    }

    if (
        data.startKm === undefined ||
        data.startKm < 0
    ) {
        throw new AppError(
            "Invalid Start KM.",
            400
        );
    }

    data.status = DUTY_STATUS.STARTED;
    data.dutyStartTime = new Date();
    data.createdBy = userId;
    data.updatedBy = userId;

    const duty =
        await dutyRepository.create(data);

    await vehicleAssignmentRepository.updateById(
        assignment._id,
        {
            status: VEHICLE_ASSIGNMENT_STATUS.ON_DUTY,
        }
    );

    await notificationService.createNotification({

        recipientUser: userId,

        title: "Duty Started",

        message: "Duty has been started successfully.",

        type: "DUTY_STARTED",

        referenceType: "DUTY",

        referenceId: duty._id,

    });

    await auditLogService.createLog({

        user: userId,

        action: "CREATE",

        module: "DUTY",

        referenceId: duty._id,

        description: "Duty started.",

    });

    return duty;

};

/**
 * Get Duty
 */
const getDuty = async (id) => {

    const duty =
        await dutyRepository.findById(id);

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

    const duty =
        await dutyRepository.findById(id);

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    if (duty.status !== DUTY_STATUS.STARTED) {
        throw new AppError(
            "Only an active duty can be completed.",
            400
        );
    }

    if (
        data.endKm === undefined ||
        data.endKm < duty.startKm
    ) {
        throw new AppError(
            "End KM cannot be less than Start KM.",
            400
        );
    }

    const totalKm =
        data.endKm - duty.startKm;

    const completedDuty =
        await dutyRepository.updateById(
            id,
            {
                endKm: data.endKm,
                totalKm,
                status: DUTY_STATUS.COMPLETED,
                dutyEndTime: new Date(),
                updatedBy: userId,
            }
        );

    if (!completedDuty) {
        throw new AppError(
            "Failed to complete duty.",
            500
        );
    }

    await vehicleAssignmentRepository.updateById(
        duty.vehicleAssignment._id ||
        duty.vehicleAssignment,
        {
            endKm: data.endKm,
            totalKm,
            status:
                VEHICLE_ASSIGNMENT_STATUS.COMPLETED,
            updatedBy: userId,
        }
    );

    await notificationService.createNotification({
        recipientUser: userId,
        title: "Duty Completed",
        message: "Duty completed successfully.",
        type: "DUTY_COMPLETED",
        referenceType: "DUTY",
        referenceId: completedDuty._id,
    });

    await auditLogService.createLog({
        user: userId,
        action: "UPDATE",
        module: "DUTY",
        referenceId: completedDuty._id,
        description: "Duty completed.",
    });

    return completedDuty;
};

/**
 * Update Expenses
 */
const updateExpenses = async (
    id,
    expenses,
    userId
) => {

    const duty =
        await dutyRepository.findById(id);

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    expenses.updatedBy = userId;

    const updatedDuty =
        await dutyRepository.updateById(
            id,
            expenses
        );

    await auditLogService.createLog({

        user: userId,

        action: "UPDATE",

        module: "DUTY",

        referenceId: updatedDuty._id,

        description: "Duty expenses updated.",

    });

    return updatedDuty;

};

module.exports = {
    startDuty,
    getDuty,
    completeDuty,
    updateExpenses,
};