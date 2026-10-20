
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
    let dutyStartTime;

    try {
        await session.withTransaction(async () => {
            // Always read the latest assignment inside the transaction.
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

            dutyStartTime = new Date();

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
