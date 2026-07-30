const vehicleRepository = require("../repositories/vehicle.repository");
const vendorRepository = require("../repositories/vendor.repository");
const driverRepository = require("../repositories/driver.repository");

const AppError = require("../utils/appError");

/**
 * Create Vehicle
 */
const createVehicle = async (
    vehicleData,
    userId
) => {

    const vendor =
        await vendorRepository.findById(
            vehicleData.vendor
        );

    if (!vendor) {
        throw new AppError(
            "Vendor not found.",
            404
        );
    }

    const existingVehicle =
        await vehicleRepository.findByVehicleNumber(
            vehicleData.vehicleNumber
        );

    if (existingVehicle) {
        throw new AppError(
            "Vehicle number already exists.",
            409
        );
    }

    if (vehicleData.currentDriver) {

        const driver =
            await driverRepository.findById(
                vehicleData.currentDriver
            );

        if (!driver) {
            throw new AppError(
                "Driver not found.",
                404
            );
        }

        // Optional Business Rule
        if (
            driver.vendor.toString() !==
            vehicleData.vendor.toString()
        ) {
            throw new AppError(
                "Driver must belong to the selected vendor.",
                400
            );
        }

        const assignedVehicle =
            await vehicleRepository.findByCurrentDriver(
                vehicleData.currentDriver
            );

        if (assignedVehicle) {
            throw new AppError(
                "Driver is already assigned to another vehicle.",
                409
            );
        }
    }

    vehicleData.createdBy = userId;
    vehicleData.updatedBy = userId;

    return await vehicleRepository.create(
        vehicleData
    );
};

/**
 * Get All Vehicles
 */
const getAllVehicles = async () => {

    return await vehicleRepository.findAll();

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

    if (updateData.vendor) {

        const vendor =
            await vendorRepository.findById(
                updateData.vendor
            );

        if (!vendor) {
            throw new AppError(
                "Vendor not found.",
                404
            );
        }
    }

    if (
        updateData.vehicleNumber &&
        updateData.vehicleNumber !==
            vehicle.vehicleNumber
    ) {

        const existingVehicle =
            await vehicleRepository.findByVehicleNumber(
                updateData.vehicleNumber
            );

        if (existingVehicle) {
            throw new AppError(
                "Vehicle number already exists.",
                409
            );
        }
    }

    if (updateData.currentDriver) {

        const driver =
            await driverRepository.findById(
                updateData.currentDriver
            );

        if (!driver) {
            throw new AppError(
                "Driver not found.",
                404
            );
        }

        const vendorId =
            updateData.vendor || vehicle.vendor;

        if (
            driver.vendor.toString() !==
            vendorId.toString()
        ) {
            throw new AppError(
                "Driver must belong to the selected vendor.",
                400
            );
        }

        const assignedVehicle =
            await vehicleRepository.findByCurrentDriver(
                updateData.currentDriver
            );

        if (
            assignedVehicle &&
            assignedVehicle._id.toString() !==
                vehicleId
        ) {
            throw new AppError(
                "Driver is already assigned to another vehicle.",
                409
            );
        }
    }

    updateData.updatedBy = userId;

    return await vehicleRepository.updateById(
        vehicleId,
        updateData
    );
};

/**
 * Delete Vehicle
 */
const deleteVehicle = async (
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

    await vehicleRepository.softDelete(
        vehicleId
    );

    return {
        message:
            "Vehicle deleted successfully."
    };
};

/**
 * Update Vehicle Status
 */
const updateVehicleStatus = async (
    vehicleId,
    status
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

    return await vehicleRepository.updateStatus(
        vehicleId,
        status
    );
};

module.exports = {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    updateVehicle,
    deleteVehicle,
    updateVehicleStatus,
};