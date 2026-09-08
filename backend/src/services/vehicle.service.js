const mongoose = require("mongoose");

const vehicleRepository =
    require("../repositories/vehicle.repository");

const vendorRepository =
    require("../repositories/vendor.repository");

const driverRepository =
    require("../repositories/driver.repository");

const AppError =
    require("../utils/AppError");

const {
    VEHICLE_STATUS,
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
];


const pickFields = (data, fields) => {
    return fields.reduce((result, field) => {
        if (
            Object.prototype.hasOwnProperty.call(
                data,
                field
            )
        ) {
            result[field] = data[field];
        }

        return result;
    }, {});
};


const getId = (value) => {
    return value?._id || value || null;
};


/**
 * Validate driver against vehicle/vendor.
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

    const driverVendorId =
        getId(driver.vendor);

    if (
        !driverVendorId ||
        driverVendorId.toString() !==
        vendorId.toString()
    ) {
        throw new AppError(
            "Driver must belong to the selected vendor.",
            400
        );
    }

    if (
        driver.currentVehicle &&
        (
            !vehicleId ||
            getId(driver.currentVehicle).toString() !==
            vehicleId.toString()
        )
    ) {
        throw new AppError(
            "Driver is already assigned to another vehicle.",
            409
        );
    }

    const assignedVehicle =
        await vehicleRepository.findByCurrentDriver(
            driverId,
            session
        );

    if (
        assignedVehicle &&
        (
            !vehicleId ||
            assignedVehicle._id.toString() !==
            vehicleId.toString()
        )
    ) {
        throw new AppError(
            "Driver is already assigned to another vehicle.",
            409
        );
    }

    return driver;
};


/**
 * Create Vehicle
 */
const createVehicle = async (
    vehicleData,
    userId
) => {

    const data =
        pickFields(
            vehicleData,
            CREATE_FIELDS
        );

    if (!data.vendor) {
        throw new AppError(
            "Vendor is required.",
            400
        );
    }

    const session =
        await mongoose.startSession();

    let vehicle;

    try {

        await session.withTransaction(
            async () => {

                const vendor =
                    await vendorRepository.findById(
                        data.vendor
                    );

                if (!vendor) {
                    throw new AppError(
                        "Vendor not found.",
                        404
                    );
                }

                if (data.vehicleNumber) {
                    const existingVehicle =
                        await vehicleRepository.findByVehicleNumber(
                            data.vehicleNumber,
                            session
                        );

                    if (existingVehicle) {
                        throw new AppError(
                            "Vehicle number already exists.",
                            409
                        );
                    }
                }

                const driver =
                    await validateDriver(
                        data.currentDriver,
                        data.vendor,
                        null,
                        session
                    );

                data.status =
                    driver
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

                if (driver) {

                    const updatedDriver =
                        await driverRepository.updateById(
                            driver._id,
                            {
                                currentVehicle:
                                    vehicle._id,

                                updatedBy:
                                    userId,
                            },
                            session
                        );

                    if (!updatedDriver) {
                        throw new AppError(
                            "Failed to synchronize driver with vehicle.",
                            500
                        );
                    }
                }
            }
        );

    } finally {
        await session.endSession();
    }

    return vehicle;
};


/**
 * Get All Vehicles
 */
const getAllVehicles = async () => {
    return vehicleRepository.findAll();
};


/**
 * Get Vehicle By ID
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


/**
 * Update Vehicle
 */
const updateVehicle = async (
    vehicleId,
    updateData,
    userId
) => {

    const data =
        pickFields(
            updateData,
            UPDATE_FIELDS
        );

    if (
        Object.keys(data).length === 0
    ) {
        throw new AppError(
            "No valid vehicle fields were provided for update.",
            400
        );
    }

    const driverWasUpdated =
        Object.prototype.hasOwnProperty.call(
            data,
            "currentDriver"
        );

    const session =
        await mongoose.startSession();

    let updatedVehicle;

    try {

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

                const oldDriverId =
                    getId(
                        vehicle.currentDriver
                    );

                const newDriverId =
                    driverWasUpdated
                        ? data.currentDriver
                        : oldDriverId;

                const effectiveVendorId =
                    data.vendor ||
                    getId(vehicle.vendor);

                if (!effectiveVendorId) {
                    throw new AppError(
                        "Vehicle vendor not found.",
                        400
                    );
                }

                if (data.vendor) {

                    const vendor =
                        await vendorRepository.findById(
                            data.vendor
                        );

                    if (!vendor) {
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

                    if (existingVehicle) {
                        throw new AppError(
                            "Vehicle number already exists.",
                            409
                        );
                    }
                }

                if (newDriverId) {
                    await validateDriver(
                        newDriverId,
                        effectiveVendorId,
                        vehicleId,
                        session
                    );

                    const driver =
                        await driverRepository.findById(
                            newDriverId,
                            session
                        );

                    if (!driver) {
                        throw new AppError(
                            "Driver not found.",
                            404
                        );
                    }

                    const driverVendorId =
                        getId(driver.vendor);

                    if (
                        !driverVendorId ||
                        driverVendorId.toString() !==
                        effectiveVendorId.toString()
                    ) {
                        throw new AppError(
                            "Vehicle vendor must match the assigned driver's vendor.",
                            400
                        );
                    }
                }

                /*
                 * Driver assignment controls the vehicle's
                 * operational assignment status.
                 *
                 * This must happen AFTER the request whitelist
                 * because status is otherwise not accepted from
                 * the normal update request.
                 */
                if (driverWasUpdated) {
                    data.status = newDriverId
                        ? VEHICLE_STATUS.ASSIGNED
                        : VEHICLE_STATUS.AVAILABLE;
                }

                /*
                 * If the driver is being removed,
                 * the vehicle becomes AVAILABLE.
                 */
                if (
                    driverWasUpdated &&
                    !newDriverId
                ) {
                    data.status =
                        VEHICLE_STATUS.AVAILABLE;
                }

                /*
                 * If vendor changes while retaining
                 * the existing driver, the driver must
                 * belong to the new vendor.
                 */
                if (
                    data.vendor &&
                    newDriverId
                ) {

                    const driver =
                        await driverRepository.findById(
                            newDriverId,
                            session
                        );

                    if (!driver) {
                        throw new AppError(
                            "Driver not found.",
                            404
                        );
                    }

                    const driverVendorId =
                        getId(driver.vendor);

                    if (
                        !driverVendorId ||
                        driverVendorId.toString() !==
                        data.vendor.toString()
                    ) {
                        throw new AppError(
                            "Vehicle vendor must match the assigned driver's vendor.",
                            400
                        );
                    }
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
                        "Failed to update vehicle.",
                        500
                    );
                }

                /*
                 * Driver synchronization.
                 */
                if (driverWasUpdated) {

                    /*
                     * Remove old driver.
                     */
                    if (
                        oldDriverId &&
                        !newDriverId
                    ) {

                        const oldDriver =
                            await driverRepository.findById(
                                oldDriverId,
                                session
                            );

                        if (
                            oldDriver &&
                            oldDriver.currentVehicle &&
                            getId(
                                oldDriver.currentVehicle
                            ).toString() ===
                            vehicleId.toString()
                        ) {

                            await driverRepository.updateById(
                                oldDriverId,
                                {
                                    currentVehicle:
                                        null,

                                    updatedBy:
                                        userId,
                                },
                                session
                            );
                        }
                    }

                    /*
                     * Driver changed.
                     */
                    if (
                        newDriverId &&
                        (
                            !oldDriverId ||
                            oldDriverId.toString() !==
                            newDriverId.toString()
                        )
                    ) {

                        /*
                         * Clear old driver.
                         */
                        if (oldDriverId) {

                            const oldDriver =
                                await driverRepository.findById(
                                    oldDriverId,
                                    session
                                );

                            if (
                                oldDriver &&
                                oldDriver.currentVehicle &&
                                getId(
                                    oldDriver.currentVehicle
                                ).toString() ===
                                vehicleId.toString()
                            ) {

                                await driverRepository.updateById(
                                    oldDriverId,
                                    {
                                        currentVehicle:
                                            null,

                                        updatedBy:
                                            userId,
                                    },
                                    session
                                );
                            }
                        }

                        /*
                         * Assign new driver.
                         */
                        const newDriver =
                            await driverRepository.updateById(
                                newDriverId,
                                {
                                    currentVehicle:
                                        vehicleId,

                                    updatedBy:
                                        userId,
                                },
                                session
                            );

                        if (!newDriver) {
                            throw new AppError(
                                "Failed to synchronize new driver with vehicle.",
                                500
                            );
                        }
                    }
                }
            }
        );

    } finally {
        await session.endSession();
    }

    return updatedVehicle;
};


/**
 * Delete Vehicle
 */
const deleteVehicle = async (
    vehicleId,
    userId
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

    if (vehicle.currentDriver) {
        throw new AppError(
            "Cannot delete a vehicle while a driver is assigned. Unassign the driver first.",
            400
        );
    }

    const deletedVehicle =
        await vehicleRepository.softDelete(
            vehicleId
        );

    if (!deletedVehicle) {
        throw new AppError(
            "Failed to delete vehicle.",
            500
        );
    }

    return deletedVehicle;
};


/**
 * Update Vehicle Status
 */
const updateVehicleStatus = async (
    vehicleId,
    status,
    userId
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

    if (
        vehicle.currentDriver &&
        (
            status ===
            VEHICLE_STATUS.AVAILABLE ||
            status ===
            VEHICLE_STATUS.MAINTENANCE ||
            status ===
            VEHICLE_STATUS.INACTIVE
        )
    ) {
        throw new AppError(
            "Cannot set an assigned vehicle to this status. Unassign the driver first.",
            400
        );
    }

    const updatedVehicle =
        await vehicleRepository.updateStatus(
            vehicleId,
            status,
            userId
        );

    if (!updatedVehicle) {
        throw new AppError(
            "Failed to update vehicle status.",
            500
        );
    }

    return updatedVehicle;
};


module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
};