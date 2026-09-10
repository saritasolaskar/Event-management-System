
const mongoose = require("mongoose");

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
} = require("../constants/vehicleStatus");

const {
    createAuditLog,
} = require("./auditLog.service");

const {
    createNotification,
} = require("./notification.service");


/*
 * Fields that are allowed while creating a vehicle.
 * Everything else from req.body is ignored.
 */
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
];


/*
 * Fields that can be modified through the normal
 * vehicle update endpoint.
 *
 * Status is intentionally excluded.
 * Status has its own endpoint.
 */
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

    if (typeof value === "object" && value._id) {
        return value._id.toString();
    }

    return value.toString();
};


/*
 * Validate that the driver can be assigned to the vehicle.
 */
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
        getId(driver.vendor) !==
            getId(vendorId)
    ) {
        throw new AppError(
            "Driver does not belong to the selected vendor.",
            400
        );
    }

    /*
     * A driver can have only one current vehicle.
     *
     * Allow the same vehicle, but reject another vehicle.
     */
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


/*
 * Create vehicle
 */
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

                if (!data.vehicleNumber) {
                    throw new AppError(
                        "Vehicle number is required.",
                        400
                    );
                }

                /*
                 * Vehicle number must be unique.
                 */
                const existingVehicle =
                    await vehicleRepository.findByVehicleNumber(
                        data.vehicleNumber,
                        session
                    );

                if (existingVehicle) {
                    throw new AppError(
                        "Vehicle with this vehicle number already exists.",
                        409
                    );
                }

                /*
                 * Validate vendor.
                 */
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

                /*
                 * If a driver is provided,
                 * validate vendor relationship.
                 */
                if (data.currentDriver) {

                    await validateDriver(
                        data.currentDriver,
                        data.vendor,
                        null,
                        session
                    );
                }

                /*
                 * Status is controlled by the server.
                 */
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

                /*
                 * Keep Driver.currentVehicle
                 * synchronized with Vehicle.currentDriver.
                 */
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

        await createAuditLog({
            action: "CREATE",
            module: "VEHICLE",
            entityId: vehicle._id,
            userId,
            metadata: {
                vehicleNumber:
                    vehicle.vehicleNumber,
            },
        });

        await createNotification({
            type: "VEHICLE_CREATED",
            title: "Vehicle Created",
            message:
                `Vehicle ${vehicle.vehicleNumber} was created.`,
            recipient: userId,
            metadata: {
                vehicleId: vehicle._id,
            },
        });

        return vehicle;

    } finally {

        await session.endSession();
    }
};


/*
 * Get all vehicles
 */
const getAllVehicles = async (
    filter = {}
) => {

    return vehicleRepository.findAll(
        filter
    );
};


/*
 * Get vehicle by ID
 */
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


/*
 * Update vehicle
 */
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
                    Object.keys(data).length === 0
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

                /*
                 * Validate new vendor.
                 */
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

                /*
                 * Handle vehicle number change.
                 */
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
                        ? getId(data.currentDriver)
                        : oldDriverId;

                /*
                 * Validate the new driver against
                 * the effective vendor.
                 */
                if (driverWasUpdated) {

                    if (newDriverId) {

                        await validateDriver(
                            newDriverId,
                            newVendorId,
                            vehicleId,
                            session
                        );
                    }
                }

                /*
                 * IMPORTANT FIX:
                 *
                 * If currentDriver is explicitly changed,
                 * vehicle status must be synchronized.
                 *
                 * Assigning a driver -> ASSIGNED
                 * Removing a driver -> AVAILABLE
                 *
                 * But if the vehicle is ON_DUTY, do not allow
                 * driver replacement/removal.
                 */
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

                    /*
                     * Do NOT accept status from req.body.
                     * Status is derived from currentDriver here.
                     */
                    data.status =
                        newDriverId
                            ? VEHICLE_STATUS.ASSIGNED
                            : VEHICLE_STATUS.AVAILABLE;
                }

                /*
                 * Status is never directly accepted from
                 * the normal update request.
                 *
                 * However, when currentDriver changes,
                 * the internally derived status must be preserved.
                 */
                const statusToApply =
                    data.status;

                delete data.status;

                if (statusToApply) {
                    data.status =
                        statusToApply;
                }

                data.updatedBy = userId;

                /*
                 * Update vehicle.
                 */
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

                /*
                 * Release old driver's vehicle reference.
                 */
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

                /*
                 * Assign new driver's vehicle reference.
                 */
                if (
                    driverWasUpdated &&
                    newDriverId &&
                    oldDriverId !== newDriverId
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

        await createAuditLog({
            action: "UPDATE",
            module: "VEHICLE",
            entityId: vehicleId,
            userId,
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


/*
 * Delete vehicle
 */
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

                /*
                 * Do not delete a vehicle currently
                 * assigned to an active duty.
                 */
                if (
                    vehicle.status ===
                        VEHICLE_STATUS.ON_DUTY
                ) {
                    throw new AppError(
                        "Cannot delete a vehicle while it is on duty.",
                        400
                    );
                }

                /*
                 * Prevent deletion when active
                 * vehicle assignments exist.
                 */
                const activeAssignments =
                    await vehicleAssignmentRepository.findByVehicle(
                        vehicleId
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

                /*
                 * Release driver's vehicle reference.
                 */
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

        await createAuditLog({
            action: "DELETE",
            module: "VEHICLE",
            entityId: vehicleId,
            userId,
        });

        return deletedVehicle;

    } finally {

        await session.endSession();
    }
};


/*
 * Update vehicle status
 */
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

                /*
                 * Cannot mark vehicle AVAILABLE
                 * when it still has a driver.
                 */
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

                /*
                 * Cannot mark vehicle ASSIGNED
                 * without a driver.
                 */
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

                /*
                 * Do not manually change an ON_DUTY
                 * vehicle through the generic status endpoint.
                 * Duty service controls ON_DUTY/COMPLETED transitions.
                 */
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

        await createAuditLog({
            action: "STATUS_UPDATE",
            module: "VEHICLE",
            entityId: vehicleId,
            userId,
            metadata: {
                status,
            },
        });

        return vehicle;

    } finally {

        await session.endSession();
    }
};


module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
};
