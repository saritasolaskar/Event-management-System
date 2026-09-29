const mongoose = require("mongoose");

const dutyRepository =
    require("../repositories/duty.repository");

const vehicleAssignmentRepository =
    require("../repositories/vehicleAssignment.repository");

const notificationService =
    require("./notification.service");

const auditLogService =
    require("./auditLog.service");

const AppError =
    require("../utils/AppError");

const {
    DUTY_STATUS,
    VEHICLE_ASSIGNMENT_STATUS,
} = require("../constants/status");


const startDuty = async (
    data,
    userId,
    driverId
) => {

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

    const assignedDriver =
        assignment.driver?._id ||
        assignment.driver;

    if (
        !assignedDriver ||
        assignedDriver.toString() !==
            driverId.toString()
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

    if (
        data.startKm === undefined ||
        data.startKm < 0
    ) {
        throw new AppError(
            "Invalid Start KM.",
            400
        );
    }

    const session =
        await mongoose.startSession();

    let duty;

    const dutyStartTime =
        new Date();

    try {

        await session.withTransaction(
            async () => {

                const existingDuty =
                    await dutyRepository.findByVehicleAssignment(
                        data.vehicleAssignment,
                        session
                    );

                if (existingDuty) {
                    throw new AppError(
                        "A duty already exists for this vehicle assignment.",
                        409
                    );
                }

                duty =
                    await dutyRepository.create(
                        {
                            ...data,

                            status:
                                DUTY_STATUS.STARTED,

                            dutyStartTime,

                            createdBy:
                                userId,

                            updatedBy:
                                userId,
                        },
                        session
                    );

                const updatedAssignment =
                    await vehicleAssignmentRepository.updateByIdAndStatus(
                        assignment._id,
                        VEHICLE_ASSIGNMENT_STATUS.ASSIGNED,
                        {
                            startKm:
                                data.startKm,

                            dutyStartTime,

                            status:
                                VEHICLE_ASSIGNMENT_STATUS.ON_DUTY,

                            updatedBy:
                                userId,
                        },
                        session
                    );

                if (!updatedAssignment) {
                    throw new AppError(
                        "Vehicle Assignment was changed by another operation. Please refresh and try again.",
                        409
                    );
                }
            }
        );

    } finally {
        await session.endSession();
    }

    await notificationService.createNotification({
        recipientUser:
            userId,

        title:
            "Duty Started",

        message:
            "Duty has been started successfully.",

        type:
            "DUTY_STARTED",

        referenceType:
            "DUTY",

        referenceId:
            duty._id,
    });

    await auditLogService.createLog({
        user:
            userId,

        action:
            "CREATE",

        module:
            "DUTY",

        referenceId:
            duty._id,

        description:
            "Duty started.",
    });

    return duty;
};


const getDuty = async (
    id,
    driverId = null
) => {

    const duty =
        await dutyRepository.findById(
            id
        );

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    if (driverId) {

        const assignedDriver =
            duty.vehicleAssignment?.driver?._id ||
            duty.vehicleAssignment?.driver;

        if (
            !assignedDriver ||
            assignedDriver.toString() !==
                driverId.toString()
        ) {
            throw new AppError(
                "You are not authorized to view this duty.",
                403
            );
        }
    }

    return duty;
};


const completeDuty = async (
    id,
    data,
    userId,
    driverId
) => {

    const duty =
        await dutyRepository.findById(
            id
        );

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    const assignedDriver =
        duty.vehicleAssignment?.driver?._id ||
        duty.vehicleAssignment?.driver;

    if (
        !assignedDriver ||
        assignedDriver.toString() !==
            driverId.toString()
    ) {
        throw new AppError(
            "You are not authorized to complete this duty.",
            403
        );
    }

    if (!duty.vehicleAssignment) {
        throw new AppError(
            "Vehicle Assignment not found for this duty.",
            404
        );
    }

    if (
        duty.vehicleAssignment.status !==
        VEHICLE_ASSIGNMENT_STATUS.ON_DUTY
    ) {
        throw new AppError(
            "Vehicle Assignment is not currently on duty.",
            400
        );
    }

    if (
        duty.status !==
        DUTY_STATUS.STARTED
    ) {
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

    const dutyEndTime =
        new Date();

    const session =
        await mongoose.startSession();

    let completedDuty;

    try {

        await session.withTransaction(
            async () => {

                completedDuty =
                    await dutyRepository.updateByIdAndStatus(
                        id,
                        DUTY_STATUS.STARTED,
                        {
                            endKm:
                                data.endKm,

                            totalKm,

                            status:
                                DUTY_STATUS.COMPLETED,

                            dutyEndTime,

                            updatedBy:
                                userId,
                        },
                        session
                    );

                if (!completedDuty) {
                    throw new AppError(
                        "Duty was changed by another operation. Please refresh and try again.",
                        409
                    );
                }

                const updatedAssignment =
                    await vehicleAssignmentRepository.updateByIdAndStatus(
                        duty.vehicleAssignment._id ||
                            duty.vehicleAssignment,

                        VEHICLE_ASSIGNMENT_STATUS.ON_DUTY,

                        {
                            endKm:
                                data.endKm,

                            totalKm,

                            dutyEndTime,

                            status:
                                VEHICLE_ASSIGNMENT_STATUS.COMPLETED,

                            updatedBy:
                                userId,
                        },

                        session
                    );

                if (!updatedAssignment) {
                    throw new AppError(
                        "Vehicle Assignment was changed by another operation. Please refresh and try again.",
                        409
                    );
                }
            }
        );

    } finally {
        await session.endSession();
    }

    await notificationService.createNotification({
        recipientUser:
            userId,

        title:
            "Duty Completed",

        message:
            "Duty completed successfully.",

        type:
            "DUTY_COMPLETED",

        referenceType:
            "DUTY",

        referenceId:
            completedDuty._id,
    });

    await auditLogService.createLog({
        user:
            userId,

        action:
            "UPDATE",

        module:
            "DUTY",

        referenceId:
            completedDuty._id,

        description:
            "Duty completed.",
    });

    return completedDuty;
};


const updateExpenses = async (
    id,
    expenses,
    userId,
    driverId
) => {

    const duty =
        await dutyRepository.findById(
            id
        );

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    const assignedDriver =
        duty.vehicleAssignment?.driver?._id ||
        duty.vehicleAssignment?.driver;

    if (
        !assignedDriver ||
        assignedDriver.toString() !==
            driverId.toString()
    ) {
        throw new AppError(
            "You are not authorized to update this duty.",
            403
        );
    }

    if (
        duty.status ===
        DUTY_STATUS.COMPLETED
    ) {
        throw new AppError(
            "Expenses cannot be modified after duty completion.",
            400
        );
    }

    const expenseData = {
        updatedBy:
            userId,
    };

    if (expenses.DA !== undefined) {
        expenseData.DA =
            expenses.DA;
    }

    if (expenses.toll !== undefined) {
        expenseData.toll =
            expenses.toll;
    }

    if (expenses.parking !== undefined) {
        expenseData.parking =
            expenses.parking;
    }

    if (expenses.entry !== undefined) {
        expenseData.entry =
            expenses.entry;
    }

    if (expenses.remarks !== undefined) {
        expenseData.remarks =
            expenses.remarks;
    }

    const updatedDuty =
        await dutyRepository.updateByIdAndStatus(
            id,
            DUTY_STATUS.STARTED,
            expenseData
        );

    if (!updatedDuty) {
        throw new AppError(
            "Expenses cannot be modified after duty completion.",
            400
        );
    }

    await auditLogService.createLog({
        user:
            userId,

        action:
            "UPDATE",

        module:
            "DUTY",

        referenceId:
            updatedDuty._id,

        description:
            "Duty expenses updated.",
    });

    return updatedDuty;
};


module.exports = {
    startDuty,
    getDuty,
    completeDuty,
    updateExpenses,
};