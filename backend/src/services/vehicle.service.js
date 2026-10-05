const mongoose = require("mongoose");
const XLSX = require("xlsx");
const vehicleRepository =
    require("../repositories/vehicle.repository");

const driverRepository =
    require("../repositories/driver.repository");

const vendorRepository =
    require("../repositories/vendor.repository");

const vehicleAssignmentRepository =
    require("../repositories/vehicleAssignment.repository");

const AppError =
    require("../utils/AppError");

const {
    VEHICLE_STATUS,
} = require("../constants/status");

const {
    createLog,
} = require("./auditLog.service");

const {
    createNotification,
} = require("./notification.service");

const eventRepository =
    require("../repositories/event.repository");

const {
    EVENT_STATUS,
} = require("../constants/status");

const CREATE_FIELDS = [
    "vehicleNumber",
    "vehicleType",
    "brand",
    "model",
    "manufactureYear",
    "fuelType",
    "seatingCapacity",
    "vendor",
    "currentDriver",
    "rcExpiry",
    "insuranceExpiry",
    "permitExpiry",
    "fitnessExpiry",
    "pucExpiry",
    "gpsEnabled",
    "remarks",
    "event",
];


const UPDATE_FIELDS = [
    "vehicleNumber",
    "vehicleType",
    "brand",
    "model",
    "manufactureYear",
    "fuelType",
    "seatingCapacity",
    "vendor",
    "currentDriver",
    "rcExpiry",
    "insuranceExpiry",
    "permitExpiry",
    "fitnessExpiry",
    "pucExpiry",
    "gpsEnabled",
    "remarks",
];


const pickFields = (
    data,
    fields
) => {

    const result = {};

    for (const field of fields) {

        if (
            Object.prototype.hasOwnProperty.call(
                data,
                field
            )
        ) {
            result[field] =
                data[field];
        }
    }

    return result;
};


const getId = (value) => {

    if (!value) {
        return null;
    }

    if (
        typeof value === "object" &&
        value._id
    ) {
        return value._id.toString();
    }

    return value.toString();
};


const validateEventForVehicle = async (
    eventId,
    session = null
) => {
    if (!eventId) {
        throw new AppError(
            "Event is required when adding a vehicle.",
            400
        );
    }

    const event =
        await eventRepository.findById(
            eventId,
            session
        );

    if (!event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    if (
        event.status === EVENT_STATUS.CANCELLED ||
        event.status === EVENT_STATUS.COMPLETED
    ) {
        throw new AppError(
            "Vehicles cannot be added to a completed or cancelled event.",
            400
        );
    }

    return event;
};


const validateDriver = async (
    driverId,
    vendorId,
    vehicleId = null,
    session = null
) => {

    if (!driverId) {
        return null;
    }

    const driver =
        await driverRepository.findById(
            driverId,
            session
        );

    if (!driver) {
        throw new AppError(
            "Driver not found.",
            404
        );
    }

    if (driver.isDeleted) {
        throw new AppError(
            "Driver not found.",
            404
        );
    }

    if (
        driver.status !== "ACTIVE"
    ) {
        throw new AppError(
            "Only active drivers can be assigned to a vehicle.",
            400
        );
    }

    if (
        vendorId &&
        getId(driver.vendor) !==
        getId(vendorId)
    ) {
        throw new AppError(
            "Driver does not belong to the selected vendor.",
            400
        );
    }

    if (
        driver.currentVehicle &&
        getId(driver.currentVehicle) !==
        getId(vehicleId)
    ) {
        throw new AppError(
            "Driver is already assigned to another vehicle.",
            409
        );
    }

    return driver;
};


const createVehicle = async (
    vehicleData,
    userId
) => {

    const session =
        await mongoose.startSession();

    try {

        let vehicle;

        await session.withTransaction(
            async () => {

                const data =
                    pickFields(
                        vehicleData,
                        CREATE_FIELDS
                    );

                const event =
                    await validateEventForVehicle(
                        data.event,
                        session
                    );

                if (!data.vehicleNumber) {
                    throw new AppError(
                        "Vehicle number is required.",
                        400
                    );
                }

                const existingVehicle =
                    await vehicleRepository.findByVehicleNumber(
                        data.vehicleNumber,
                        session
                    );

                if (existingVehicle) {
                    const alreadyUsed =
                        existingVehicle.eventsUsedFor?.some(
                            (eventId) =>
                                getId(eventId) === getId(event._id)
                        );

                    if (alreadyUsed) {
                        throw new AppError(
                            "This vehicle is already registered for this event.",
                            409
                        );
                    }

                    await vehicleRepository.addEventUsage(
                        existingVehicle._id,
                        event._id,
                        session
                    );

                    vehicle =
                        await vehicleRepository.findById(
                            existingVehicle._id,
                            session
                        );

                    return;
                }

                if (!data.vendor) {
                    throw new AppError(
                        "Vendor is required.",
                        400
                    );
                }

                const vendor =
                    await vendorRepository.findById(
                        data.vendor,
                        session
                    );

                if (!vendor) {
                    throw new AppError(
                        "Vendor not found.",
                        404
                    );
                }

                if (vendor.isDeleted) {
                    throw new AppError(
                        "Vendor not found.",
                        404
                    );
                }

                if (data.currentDriver) {

                    await validateDriver(
                        data.currentDriver,
                        data.vendor,
                        null,
                        session
                    );
                }

                data.status =
                    data.currentDriver
                        ? VEHICLE_STATUS.ASSIGNED
                        : VEHICLE_STATUS.AVAILABLE;

                data.createdBy =
                    userId;

                data.updatedBy =
                    userId;

                data.isDeleted =
                    false;

                vehicle =
                    await vehicleRepository.create(
                        data,
                        session
                    );

                await vehicleRepository.addEventUsage(
                    vehicle._id,
                    event._id,
                    session
                );

                if (data.currentDriver) {

                    await driverRepository.updateById(
                        data.currentDriver,
                        {
                            currentVehicle:
                                vehicle._id,
                        },
                        session
                    );
                }
            }
        );

        await createLog({
            user: userId,
            action: "CREATE",
            module: "VEHICLE",
            referenceId: vehicle._id,
            description:
                `Vehicle ${vehicle.vehicleNumber} was created.`,
            metadata: {
                vehicleNumber:
                    vehicle.vehicleNumber,
            },
        });

        await createNotification({
            recipientUser: userId,
            title: "Vehicle Created",
            message:
                `Vehicle ${vehicle.vehicleNumber} was created.`,
            type: "SYSTEM",
            referenceType: "VEHICLE",
            referenceId: vehicle._id,
        });

        return vehicle;

    } finally {

        await session.endSession();
    }
};


const getAllVehicles = async (
    filter = {}
) => {

    return vehicleRepository.findAll(
        filter
    );
};


const getVehicleById = async (
    vehicleId
) => {

    const vehicle =
        await vehicleRepository.findById(
            vehicleId
        );

    if (!vehicle) {
        throw new AppError(
            "Vehicle not found.",
            404
        );
    }

    return vehicle;
};


const updateVehicle = async (
    vehicleId,
    vehicleData,
    userId
) => {

    const session =
        await mongoose.startSession();

    try {

        let updatedVehicle;

        await session.withTransaction(
            async () => {

                const vehicle =
                    await vehicleRepository.findById(
                        vehicleId,
                        session
                    );

                if (!vehicle) {
                    throw new AppError(
                        "Vehicle not found.",
                        404
                    );
                }

                const data =
                    pickFields(
                        vehicleData,
                        UPDATE_FIELDS
                    );

                if (
                    Object.keys(data).length ===
                    0
                ) {
                    throw new AppError(
                        "No valid fields provided for update.",
                        400
                    );
                }

                const oldVendorId =
                    getId(vehicle.vendor);

                const newVendorId =
                    data.vendor !== undefined
                        ? getId(data.vendor)
                        : oldVendorId;

                if (
                    data.vendor !== undefined
                ) {

                    const vendor =
                        await vendorRepository.findById(
                            data.vendor,
                            session
                        );

                    if (!vendor) {
                        throw new AppError(
                            "Vendor not found.",
                            404
                        );
                    }

                    if (vendor.isDeleted) {
                        throw new AppError(
                            "Vendor not found.",
                            404
                        );
                    }
                }

                if (
                    data.vehicleNumber &&
                    data.vehicleNumber !==
                    vehicle.vehicleNumber
                ) {

                    const existingVehicle =
                        await vehicleRepository.findByVehicleNumber(
                            data.vehicleNumber,
                            session
                        );

                    if (
                        existingVehicle &&
                        getId(
                            existingVehicle._id
                        ) !==
                        getId(vehicleId)
                    ) {
                        throw new AppError(
                            "Vehicle with this vehicle number already exists.",
                            409
                        );
                    }
                }

                const oldDriverId =
                    getId(
                        vehicle.currentDriver
                    );

                const driverWasUpdated =
                    Object.prototype.hasOwnProperty.call(
                        data,
                        "currentDriver"
                    );

                const newDriverId =
                    driverWasUpdated
                        ? getId(
                            data.currentDriver
                        )
                        : oldDriverId;

                if (
                    driverWasUpdated &&
                    newDriverId
                ) {

                    await validateDriver(
                        newDriverId,
                        newVendorId,
                        vehicleId,
                        session
                    );
                }

                if (
                    driverWasUpdated &&
                    oldDriverId !==
                    newDriverId
                ) {

                    if (
                        vehicle.status ===
                        VEHICLE_STATUS.ON_DUTY
                    ) {
                        throw new AppError(
                            "Cannot change the driver of a vehicle while it is on duty.",
                            400
                        );
                    }

                    if (
                        vehicle.status ===
                        VEHICLE_STATUS.MAINTENANCE
                    ) {
                        throw new AppError(
                            "Cannot assign a driver to a vehicle under maintenance.",
                            400
                        );
                    }

                    data.status =
                        newDriverId
                            ? VEHICLE_STATUS.ASSIGNED
                            : VEHICLE_STATUS.AVAILABLE;
                }

                data.updatedBy =
                    userId;

                updatedVehicle =
                    await vehicleRepository.updateById(
                        vehicleId,
                        data,
                        session
                    );

                if (!updatedVehicle) {
                    throw new AppError(
                        "Vehicle could not be updated.",
                        500
                    );
                }

                if (
                    driverWasUpdated &&
                    oldDriverId &&
                    oldDriverId !==
                    newDriverId
                ) {

                    await driverRepository.updateById(
                        oldDriverId,
                        {
                            currentVehicle:
                                null,
                        },
                        session
                    );
                }

                if (
                    driverWasUpdated &&
                    newDriverId &&
                    oldDriverId !==
                    newDriverId
                ) {

                    await driverRepository.updateById(
                        newDriverId,
                        {
                            currentVehicle:
                                vehicleId,
                        },
                        session
                    );
                }
            }
        );

        await createLog({
            user: userId,
            action: "UPDATE",
            module: "VEHICLE",
            referenceId: vehicleId,
            description:
                "Vehicle updated.",
            metadata: {
                updatedFields:
                    Object.keys(
                        pickFields(
                            vehicleData,
                            UPDATE_FIELDS
                        )
                    ),
            },
        });

        return updatedVehicle;

    } finally {

        await session.endSession();
    }
};


const deleteVehicle = async (
    vehicleId,
    userId
) => {

    const session =
        await mongoose.startSession();

    try {

        let deletedVehicle;

        await session.withTransaction(
            async () => {

                const vehicle =
                    await vehicleRepository.findById(
                        vehicleId,
                        session
                    );

                if (!vehicle) {
                    throw new AppError(
                        "Vehicle not found.",
                        404
                    );
                }

                if (
                    vehicle.status ===
                    VEHICLE_STATUS.ON_DUTY
                ) {
                    throw new AppError(
                        "Cannot delete a vehicle while it is on duty.",
                        400
                    );
                }

                const activeAssignments =
                    await vehicleAssignmentRepository.findByVehicle(
                        vehicleId,
                        session
                    );

                if (
                    activeAssignments &&
                    activeAssignments.length > 0
                ) {
                    throw new AppError(
                        "Cannot delete a vehicle with active assignments.",
                        400
                    );
                }

                const driverId =
                    getId(
                        vehicle.currentDriver
                    );

                deletedVehicle =
                    await vehicleRepository.softDelete(
                        vehicleId,
                        session
                    );

                if (driverId) {

                    await driverRepository.updateById(
                        driverId,
                        {
                            currentVehicle:
                                null,
                        },
                        session
                    );
                }
            }
        );

        await createLog({
            user: userId,
            action: "DELETE",
            module: "VEHICLE",
            referenceId: vehicleId,
            description:
                "Vehicle deleted.",
        });

        return deletedVehicle;

    } finally {

        await session.endSession();
    }
};


const updateVehicleStatus = async (
    vehicleId,
    status,
    userId
) => {

    const session =
        await mongoose.startSession();

    try {

        let vehicle;

        await session.withTransaction(
            async () => {

                const existingVehicle =
                    await vehicleRepository.findById(
                        vehicleId,
                        session
                    );

                if (!existingVehicle) {
                    throw new AppError(
                        "Vehicle not found.",
                        404
                    );
                }

                if (
                    !Object.values(
                        VEHICLE_STATUS
                    ).includes(status)
                ) {
                    throw new AppError(
                        "Invalid vehicle status.",
                        400
                    );
                }

                if (
                    status ===
                    VEHICLE_STATUS.AVAILABLE &&
                    existingVehicle.currentDriver
                ) {
                    throw new AppError(
                        "Vehicle with an assigned driver cannot be marked AVAILABLE.",
                        400
                    );
                }

                if (
                    status ===
                    VEHICLE_STATUS.ASSIGNED &&
                    !existingVehicle.currentDriver
                ) {
                    throw new AppError(
                        "Vehicle must have an assigned driver before it can be marked ASSIGNED.",
                        400
                    );
                }

                if (
                    existingVehicle.status ===
                    VEHICLE_STATUS.ON_DUTY &&
                    status !==
                    VEHICLE_STATUS.ON_DUTY
                ) {
                    throw new AppError(
                        "Vehicle status cannot be changed while the vehicle is on duty.",
                        400
                    );
                }

                vehicle =
                    await vehicleRepository.updateStatus(
                        vehicleId,
                        status,
                        userId,
                        session
                    );

                if (!vehicle) {
                    throw new AppError(
                        "Vehicle could not be updated.",
                        500
                    );
                }
            }
        );

        await createLog({
            user: userId,
            action: "STATUS_UPDATE",
            module: "VEHICLE",
            referenceId: vehicleId,
            description:
                `Vehicle status changed to ${status}.`,
            metadata: {
                status,
            },
        });

        return vehicle;

    } finally {

        await session.endSession();
    }
};



const getVehiclesByEvent = async (
    eventId
) => {

    const event =
        await eventRepository.findById(
            eventId
        );

    if (!event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    return vehicleRepository.findByEvent(
        eventId
    );
};


const importVehiclesFromExcel = async (
    fileBuffer,
    eventId,
    userId
) => {

    if (!fileBuffer) {
        throw new AppError(
            "Excel file is required.",
            400
        );
    }

    const workbook =
        XLSX.read(fileBuffer, {
            type: "buffer",
            cellDates: true,
        });

    const sheetName =
        workbook.SheetNames[0];

    if (!sheetName) {
        throw new AppError(
            "Excel file does not contain a worksheet.",
            400
        );
    }

    const worksheet =
        workbook.Sheets[sheetName];

    const rows =
        XLSX.utils.sheet_to_json(
            worksheet,
            {
                defval: "",
            }
        );

    if (!rows.length) {
        throw new AppError(
            "Excel file does not contain any vehicle rows.",
            400
        );
    }

    const event =
        await validateEventForVehicle(
            eventId
        );

    const imported = [];
    const skipped = [];
    const failed = [];

    for (
        let index = 0;
        index < rows.length;
        index++
    ) {

        const row =
            rows[index];

        const rowNumber =
            index + 2;

        try {

            const vehicleNumber =
                String(
                    row["Vehicle Number"] ||
                    row["vehicleNumber"] ||
                    ""
                )
                .trim()
                .toUpperCase();

            const vehicleType =
                String(
                    row["Vehicle Type"] ||
                    row["vehicleType"] ||
                    ""
                )
                .trim()
                .toUpperCase();

            const vendorName =
                String(
                    row["Vendor"] ||
                    row["vendor"] ||
                    ""
                ).trim();

            const seatingCapacity =
                Number(
                    row["Seating Capacity"] ||
                    row["seatingCapacity"] ||
                    0
                );

            const driverPhone =
                String(
                    row["Driver Phone"] ||
                    row["driverPhone"] ||
                    ""
                ).trim();

            if (!vehicleNumber) {
                throw new Error(
                    "Vehicle Number is required."
                );
            }

            if (!vehicleType) {
                throw new Error(
                    "Vehicle Type is required."
                );
            }

            if (!vendorName) {
                throw new Error(
                    "Vendor is required."
                );
            }

            if (!seatingCapacity) {
                throw new Error(
                    "Seating Capacity is required."
                );
            }

            const vendor =
                await vendorRepository
                    .findByCompanyName(
                        vendorName
                    );

            if (!vendor) {
                throw new Error(
                    `Vendor "${vendorName}" not found.`
                );
            }

            let driverId = null;

            if (driverPhone) {

                const driver =
                    await driverRepository
                        .findByPhone(
                            driverPhone
                        );

                if (!driver) {
                    throw new Error(
                        `Driver with phone ${driverPhone} not found.`
                    );
                }

                driverId =
                    driver._id;
            }

            const existingVehicle =
                await vehicleRepository
                    .findByVehicleNumber(
                        vehicleNumber
                    );

            if (existingVehicle) {

                const alreadyRegistered =
                    existingVehicle
                        .eventsUsedFor
                        ?.some(
                            (id) =>
                                getId(id) ===
                                getId(event._id)
                        );

                if (
                    alreadyRegistered
                ) {
                    skipped.push({
                        row: rowNumber,
                        vehicleNumber,
                        reason:
                            "Already registered for this event.",
                    });

                    continue;
                }

                await vehicleRepository
                    .addEventUsage(
                        existingVehicle._id,
                        event._id
                    );

                imported.push({
                    row: rowNumber,
                    vehicleNumber,
                    action: "REUSED",
                });

                continue;
            }

            await createVehicle(
                {
                    vehicleNumber,
                    vehicleType,
                    seatingCapacity,
                    vendor: vendor._id,
                    currentDriver:
                        driverId,
                    brand:
                        row["Brand"] ||
                        row["brand"] ||
                        undefined,
                    model:
                        row["Model"] ||
                        row["model"] ||
                        undefined,
                    manufactureYear:
                        row["Manufacture Year"] ||
                        row["manufactureYear"] ||
                        undefined,
                    fuelType:
                        row["Fuel Type"] ||
                        row["fuelType"] ||
                        undefined,
                    event: eventId,
                },
                userId
            );

            imported.push({
                row: rowNumber,
                vehicleNumber,
                action: "CREATED",
            });

        } catch (error) {

            failed.push({
                row: rowNumber,
                vehicleNumber:
                    row["Vehicle Number"] ||
                    row["vehicleNumber"] ||
                    "",
                reason:
                    error.message ||
                    "Unable to import vehicle.",
            });
        }
    }

    return {
        event: {
            _id: event._id,
            eventCode: event.eventCode,
            name: event.name,
        },
        totalRows: rows.length,
        importedCount: imported.length,
        skippedCount: skipped.length,
        failedCount: failed.length,
        imported,
        skipped,
        failed,
    };
};


module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
    getVehiclesByEvent,
    importVehiclesFromExcel,

};