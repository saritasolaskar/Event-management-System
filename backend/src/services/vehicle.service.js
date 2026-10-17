
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
    EVENT_STATUS,
} = require("../constants/status");

const {
    createLog,
} = require("./auditLog.service");

const {
    createNotification,
} = require("./notification.service");

const eventRepository =
    require("../repositories/event.repository");

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

const pickFields = (data, fields) => {
    const result = {};

    for (const field of fields) {
        if (
            Object.prototype.hasOwnProperty.call(
                data,
                field
            )
        ) {
            result[field] = data[field];
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

    if (driver.status !== "ACTIVE") {
        throw new AppError(
            "Only active drivers can be assigned to a vehicle.",
            400
        );
    }

    if (
        vendorId &&
        getId(driver.vendor) !== getId(vendorId)
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

                /*
                 * FIX:
                 * Reuse an existing vehicle for another event
                 * only when its vendor and driver relationships
                 * remain consistent.
                 */
                if (existingVehicle) {
                    const alreadyUsed =
                        existingVehicle.eventsUsedFor?.some(
                            (eventId) =>
                                getId(eventId) ===
                                getId(event._id)
                        );

                    if (alreadyUsed) {
                        throw new AppError(
                            "This vehicle is already registered for this event.",
                            409
                        );
                    }

                    if (
                        !data.vendor ||
                        getId(existingVehicle.vendor) !==
                            getId(data.vendor)
                    ) {
                        throw new AppError(
                            "This vehicle is already registered under a different vendor.",
                            409
                        );
                    }

                    if (
                        data.currentDriver &&
                        getId(existingVehicle.currentDriver) !==
                            getId(data.currentDriver)
                    ) {
                        throw new AppError(
                            "This vehicle is linked to a different driver. Update the vehicle's driver first.",
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

                data.createdBy = userId;
                data.updatedBy = userId;
                data.isDeleted = false;

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
                            currentVehicle: vehicle._id,
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
                vehicleNumber: vehicle.vehicleNumber,
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

const getAllVehicles = async (filter = {}) => {
    return vehicleRepository.findAll(filter);
};

const getVehicleById = async (vehicleId) => {
    const vehicle =
        await vehicleRepository.findById(vehicleId);

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

                if (Object.keys(data).length === 0) {
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

                if (data.vendor !== undefined) {
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
                    data.vehicleNumber !== vehicle.vehicleNumber
                ) {
                    const existingVehicle =
                        await vehicleRepository.findByVehicleNumber(
                            data.vehicleNumber,
                            session
                        );

                    if (
                        existingVehicle &&
                        getId(existingVehicle._id) !==
                            getId(vehicleId)
                    ) {
                        throw new AppError(
                            "Vehicle with this vehicle number already exists.",
                            409
                        );
                    }
                }

                const oldDriverId =
                    getId(vehicle.currentDriver);

                const driverWasUpdated =
                    Object.prototype.hasOwnProperty.call(
                        data,
                        "currentDriver"
                    );

                const newDriverId =
                    driverWasUpdated
                        ? getId(data.currentDriver)
                        : oldDriverId;

                if (
    (driverWasUpdated || data.vendor !== undefined) &&
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
                    oldDriverId !== newDriverId
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

                data.updatedBy = userId;

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
                    oldDriverId !== newDriverId
                ) {
                    await driverRepository.updateById(
                        oldDriverId,
                        {
                            currentVehicle: null,
                        },
                        session
                    );
                }

                if (
                    driverWasUpdated &&
                    newDriverId &&
                    oldDriverId !== newDriverId
                ) {
                    await driverRepository.updateById(
                        newDriverId,
                        {
                            currentVehicle: vehicleId,
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
            description: "Vehicle updated.",
            metadata: {
                updatedFields: Object.keys(
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
                    getId(vehicle.currentDriver);

                deletedVehicle =
                    await vehicleRepository.softDelete(
                        vehicleId,
                        session
                    );

                if (driverId) {
                    await driverRepository.updateById(
                        driverId,
                        {
                            currentVehicle: null,
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
            description: "Vehicle deleted.",
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
                    !Object.values(VEHICLE_STATUS).includes(status)
                ) {
                    throw new AppError(
                        "Invalid vehicle status.",
                        400
                    );
                }

                if (
                    status === VEHICLE_STATUS.AVAILABLE &&
                    existingVehicle.currentDriver
                ) {
                    throw new AppError(
                        "Vehicle with an assigned driver cannot be marked AVAILABLE.",
                        400
                    );
                }

                if (
                    status === VEHICLE_STATUS.ASSIGNED &&
                    !existingVehicle.currentDriver
                ) {
                    throw new AppError(
                        "Vehicle must have an assigned driver before it can be marked ASSIGNED.",
                        400
                    );
                }

                if (
                    existingVehicle.status === VEHICLE_STATUS.ON_DUTY &&
                    status !== VEHICLE_STATUS.ON_DUTY
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

const getVehiclesByEvent = async (eventId) => {
    const event =
        await eventRepository.findById(eventId);

    if (!event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    return vehicleRepository.findByEvent(eventId);
};

/*
 * Normalize Excel headings so variations such as:
 * "Vehicle Number", "Vehicle Number *", "Vehicle No"
 * can be mapped to the same supported field.
 */
const normalizeExcelHeader = (header) =>
    String(header || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const firstExcelValue = (row, aliases) => {
    for (const alias of aliases) {
        const value = row[alias];

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return "";
};

const normalizeExcelRow = (rawRow) => {
    const normalized = {};

    for (const [header, value] of Object.entries(rawRow || {})) {
        normalized[normalizeExcelHeader(header)] = value;
    }

    return normalized;
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

    const workbook = XLSX.read(fileBuffer, {
        type: "buffer",
        cellDates: true,
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
        throw new AppError(
            "Excel file does not contain a worksheet.",
            400
        );
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(
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
        await validateEventForVehicle(eventId);

    const imported = [];
    const skipped = [];
    const failed = [];

    for (let index = 0; index < rows.length; index++) {
        const row = normalizeExcelRow(rows[index]);
        const rowNumber = index + 2;

        const vehicleNumber = String(
            firstExcelValue(row, [
                "vehiclenumber",
                "vehicleno",
                "registrationnumber",
                "registrationno",
                "vehicleregistration",
                "numberplate",
                "registration",
                "plate",
            ])
        ).trim().toUpperCase();

        try {
            const vehicleType = String(
                firstExcelValue(row, [
                    "vehicletype",
                    "type",
                    "category",
                ])
            ).trim().toUpperCase();

            const vendorName = String(
                firstExcelValue(row, [
                    "vendor",
                    "vendorname",
                    "companyname",
                    "vendorcompany",
                ])
            ).trim();

            const seatingCapacity = Number(
                firstExcelValue(row, [
                    "seatingcapacity",
                    "capacity",
                    "seats",
                    "numberofseats",
                ]) || 0
            );

            const driverPhone = String(
                firstExcelValue(row, [
                    "driverphone",
                    "drivermobile",
                    "drivercontact",
                    "drivercontactnumber",
                    "phone",
                    "mobile",
                    "contactnumber",
                ])
            ).trim();

            if (!vehicleNumber) {
                throw new Error(
                    "Vehicle Number is required. Check the column heading."
                );
            }

            if (!vehicleType) {
                throw new Error(
                    "Vehicle Type is required. Check the column heading."
                );
            }

            if (!vendorName) {
                throw new Error(
                    "Vendor is required. Enter the vendor company name."
                );
            }

            if (
                !Number.isFinite(seatingCapacity) ||
                seatingCapacity <= 0
            ) {
                throw new Error(
                    "Seating Capacity must be a positive number."
                );
            }

            const vendor =
                await vendorRepository.findByCompanyName(
                    vendorName
                );

            if (!vendor || vendor.isDeleted) {
                throw new Error(
                    'Vendor "' +
                    vendorName +
                    '" not found or unavailable. Create the vendor first or check the company name.'
                );
            }

            let driverId = null;

            // Driver Phone is optional.
            if (driverPhone) {
                const driver =
                    await driverRepository.findByPhone(
                        driverPhone
                    );

                if (!driver || driver.isDeleted) {
                    throw new Error(
                        "Driver with phone " +
                        driverPhone +
                        " not found or unavailable. Check the number or leave the driver column blank."
                    );
                }

                if (driver.status !== "ACTIVE") {
                    throw new Error(
                        "Driver with phone " +
                        driverPhone +
                        " is not active."
                    );
                }

                if (
                    getId(driver.vendor) !==
                    getId(vendor._id)
                ) {
                    throw new Error(
                        'Driver with phone ' +
                        driverPhone +
                        ' does not belong to vendor "' +
                        vendorName +
                        '".'
                    );
                }

                driverId = driver._id;
            }

            const existingVehicle =
                await vehicleRepository.findByVehicleNumber(
                    vehicleNumber
                );

            if (existingVehicle) {
                const alreadyRegistered =
                    existingVehicle.eventsUsedFor?.some(
                        (id) =>
                            getId(id) === getId(event._id)
                    );

                if (alreadyRegistered) {
                    skipped.push({
                        row: rowNumber,
                        vehicleNumber,
                        reason:
                            "Already registered for this event.",
                    });

                    continue;
                }

                // Do not reuse a vehicle under a different vendor.
                if (
                    getId(existingVehicle.vendor) !==
                    getId(vendor._id)
                ) {
                    throw new Error(
                        "Vehicle " +
                        vehicleNumber +
                        " is already registered under a different vendor. The existing vehicle was not added to this event."
                    );
                }

                // If a driver was provided, it must match the
                // driver's current link to the existing vehicle.
                if (
                    driverId &&
                    getId(existingVehicle.currentDriver) !==
                    getId(driverId)
                ) {
                    throw new Error(
                        "Vehicle " +
                        vehicleNumber +
                        " is not currently linked to the driver with phone " +
                        driverPhone +
                        ". Update the vehicle's driver first, then import again."
                    );
                }

                await vehicleRepository.addEventUsage(
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

            const optionalValue = (aliases) => {
                const value =
                    firstExcelValue(row, aliases);

                return value === "" ? undefined : value;
            };

            await createVehicle(
                {
                    vehicleNumber,
                    vehicleType,
                    seatingCapacity,
                    vendor: vendor._id,
                    currentDriver: driverId,
                    brand: optionalValue([
                        "brand",
                        "make",
                    ]),
                    model: optionalValue([
                        "model",
                    ]),
                    manufactureYear: optionalValue([
                        "manufactureyear",
                        "year",
                        "modelyear",
                    ]),
                    fuelType: optionalValue([
                        "fueltype",
                        "fuel",
                    ]),
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
                vehicleNumber,
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
