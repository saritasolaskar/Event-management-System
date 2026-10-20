
const mongoose = require("mongoose");

const dutyRepository =
    require("../repositories/duty.repository");

const vehicleAssignmentRepository =
    require("../repositories/vehicleAssignment.repository");

const vehicleRepository =
    require("../repositories/vehicle.repository");

const notificationService =
    require("./notification.service");

const auditLogService =
    require("./auditLog.service");

const AppError =
    require("../utils/AppError");

const {
    DUTY_STATUS,
    VEHICLE_ASSIGNMENT_STATUS,
    VEHICLE_STATUS,
} = require("../constants/status");

const startDuty = async (data, userId, driverId) => {
    if (!mongoose.isValidObjectId(data.vehicleAssignment)) {
        throw new AppError("Invalid Vehicle Assignment ID.", 400);
    }

    if (
        data.startKm === undefined ||
        !Number.isFinite(Number(data.startKm)) ||
        Number(data.startKm) < 0
    ) {
        throw new AppError("Invalid Start KM.", 400);
    }

    const session = await mongoose.startSession();
    let duty;

    try {
        await session.withTransaction(async () => {
            const assignment =
                await vehicleAssignmentRepository.findById(
                    data.vehicleAssignment,
                    session
                );

            if (!assignment) {
                throw new AppError("Vehicle Assignment not found.", 404);
            }

            const assignedDriver =
                assignment.driver?._id || assignment.driver;

            if (
                !assignedDriver ||
                assignedDriver.toString() !== driverId.toString()
            ) {
                throw new AppError(
                    "You are not authorized to start duty for this assignment.",
                    403
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

            const vehicleId =
                assignment.vehicle?._id || assignment.vehicle;

            if (!vehicleId) {
                throw new AppError(
                    "Vehicle not found for this assignment.",
                    404
                );
            }

            const existingDuty =
                await dutyRepository.findByVehicleAssignment(
                    assignment._id,
                    session
                );

            if (existingDuty) {
                throw new AppError(
                    "A duty already exists for this vehicle assignment.",
                    409
                );
            }

            const dutyStartTime = new Date();

            duty = await dutyRepository.create(
                {
                    vehicleAssignment: assignment._id,
                    startKm: Number(data.startKm),
                    startOdometerPhoto: data.startOdometerPhoto,
                    status: DUTY_STATUS.STARTED,
                    dutyStartTime,
                    createdBy: userId,
                    updatedBy: userId,
                },
                session
            );

            const updatedAssignment =
                await vehicleAssignmentRepository.updateByIdAndStatus(
                    assignment._id,
                    VEHICLE_ASSIGNMENT_STATUS.ASSIGNED,
                    {
                        startKm: Number(data.startKm),
                        dutyStartTime,
                        status: VEHICLE_ASSIGNMENT_STATUS.ON_DUTY,
                        updatedBy: userId,
                    },
                    session
                );

            if (!updatedAssignment) {
                throw new AppError(
                    "Vehicle Assignment was changed by another operation. Please refresh and try again.",
                    409
                );
            }

            const updatedVehicle =
                await vehicleRepository.updateById(
                    vehicleId,
                    {
                        status: VEHICLE_STATUS.ON_DUTY,
                        updatedBy: userId,
                    },
                    session
                );

            if (!updatedVehicle) {
                throw new AppError(
                    "Vehicle could not be marked ON_DUTY.",
                    409
                );
            }
        });
    } finally {
        await session.endSession();
    }

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

const getDuty = async (id, driverId = null) => {
    const duty = await dutyRepository.findById(id);

    if (!duty) {
        throw new AppError("Duty not found.", 404);
    }

    if (driverId) {
        const assignedDriver =
            duty.vehicleAssignment?.driver?._id ||
            duty.vehicleAssignment?.driver;

        if (
            !assignedDriver ||
            assignedDriver.toString() !== driverId.toString()
        ) {
            throw new AppError(
                "You are not authorized to view this duty.",
                403
            );
        }
    }

    return duty;
};

const completeDuty = async (id, data, userId, driverId) => {
    const session = await mongoose.startSession();
    let completedDuty;

    try {
        await session.withTransaction(async () => {
            const duty = await dutyRepository.findById(id, session);

            if (!duty) {
                throw new AppError("Duty not found.", 404);
            }

            const assignment = duty.vehicleAssignment;

            if (!assignment) {
                throw new AppError(
                    "Vehicle Assignment not found for this duty.",
                    404
                );
            }

            const assignedDriver =
                assignment.driver?._id || assignment.driver;

            if (
                !assignedDriver ||
                assignedDriver.toString() !== driverId.toString()
            ) {
                throw new AppError(
                    "You are not authorized to complete this duty.",
                    403
                );
            }

            if (
                assignment.status !==
                VEHICLE_ASSIGNMENT_STATUS.ON_DUTY
            ) {
                throw new AppError(
                    "Vehicle Assignment is not currently on duty.",
                    400
                );
            }

            if (duty.status !== DUTY_STATUS.STARTED) {
                throw new AppError(
                    "Only an active duty can be completed.",
                    400
                );
            }

            const endKm = Number(data.endKm);

            if (
                data.endKm === undefined ||
                !Number.isFinite(endKm) ||
                endKm < duty.startKm
            ) {
                throw new AppError(
                    "End KM cannot be less than Start KM.",
                    400
                );
            }

            const totalKm = endKm - duty.startKm;
            const dutyEndTime = new Date();

            completedDuty =
                await dutyRepository.updateByIdAndStatus(
                    id,
                    DUTY_STATUS.STARTED,
                    {
                        endKm,
                        totalKm,
                        status: DUTY_STATUS.COMPLETED,
                        dutyEndTime,
                        updatedBy: userId,
                    },
                    session
                );

            if (!completedDuty) {
                throw new AppError(
                    "Duty was changed by another operation. Please refresh and try again.",
                    409
                );
            }

            const assignmentId =
                assignment._id || assignment;

            const updatedAssignment =
                await vehicleAssignmentRepository.updateByIdAndStatus(
                    assignmentId,
                    VEHICLE_ASSIGNMENT_STATUS.ON_DUTY,
                    {
                        endKm,
                        totalKm,
                        dutyEndTime,
                        status: VEHICLE_ASSIGNMENT_STATUS.COMPLETED,
                        updatedBy: userId,
                    },
                    session
                );

            if (!updatedAssignment) {
                throw new AppError(
                    "Vehicle Assignment was changed by another operation. Please refresh and try again.",
                    409
                );
            }

            const vehicleId =
                assignment.vehicle?._id || assignment.vehicle;

            if (!vehicleId) {
                throw new AppError(
                    "Vehicle not found for this assignment.",
                    404
                );
            }

            const updatedVehicle =
                await vehicleRepository.updateById(
                    vehicleId,
                    {
                        status: VEHICLE_STATUS.ASSIGNED,
                        updatedBy: userId,
                    },
                    session
                );

            if (!updatedVehicle) {
                throw new AppError(
                    "Vehicle could not be marked ASSIGNED.",
                    409
                );
            }
        });
    } finally {
        await session.endSession();
    }

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

const updateExpenses = async (id, expenses, userId, driverId) => {
    const duty = await dutyRepository.findById(id);

    if (!duty) {
        throw new AppError("Duty not found.", 404);
    }

    const assignedDriver =
        duty.vehicleAssignment?.driver?._id ||
        duty.vehicleAssignment?.driver;

    if (
        !assignedDriver ||
        assignedDriver.toString() !== driverId.toString()
    ) {
        throw new AppError(
            "You are not authorized to update this duty.",
            403
        );
    }

    if (duty.status !== DUTY_STATUS.STARTED) {
        throw new AppError(
            "Expenses can only be modified while duty is active.",
            400
        );
    }

    const expenseData = {
        updatedBy: userId,
    };

    for (const field of ["DA", "toll", "parking", "entry"]) {
        if (expenses[field] !== undefined) {
            const value = Number(expenses[field]);

            if (!Number.isFinite(value) || value < 0) {
                throw new AppError(
                    `${field} must be a non-negative number.`,
                    400
                );
            }

            expenseData[field] = value;
        }
    }

    if (expenses.remarks !== undefined) {
        expenseData.remarks = expenses.remarks;
    }

    const updatedDuty =
        await dutyRepository.updateByIdAndStatus(
            id,
            DUTY_STATUS.STARTED,
            expenseData
        );

    if (!updatedDuty) {
        throw new AppError(
            "Duty is no longer active. Refresh and try again.",
            409
        );
    }

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
