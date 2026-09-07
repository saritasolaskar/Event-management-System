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


    /*
     * Validate Driver if vehicle is
     * being assigned during creation.
     */
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


        const driverVendorId =
            driver.vendor?._id ||
            driver.vendor;


        if (
            !driverVendorId ||
            driverVendorId.toString() !==
                vehicleData.vendor.toString()
        ) {
            throw new AppError(
                "Driver must belong to the selected vendor.",
                400
            );
        }


        /*
         * A driver can only have one
         * current vehicle.
         */
        if (driver.currentVehicle) {

            throw new AppError(
                "Driver is already assigned to another vehicle.",
                409
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


        /*
         * New vehicle with a driver must
         * start as ASSIGNED.
         */
        vehicleData.status =
            VEHICLE_STATUS.ASSIGNED;
    }


    vehicleData.createdBy =
        userId;

    vehicleData.updatedBy =
        userId;


    /*
     * Create Vehicle.
     */
    const vehicle =
        await vehicleRepository.create(
            vehicleData
        );


    /*
     * Synchronize Driver → Vehicle.
     */
    if (vehicle.currentDriver) {

        const driver =
            await driverRepository.findById(
                vehicle.currentDriver
            );

        if (!driver) {

            /*
             * Defensive rollback.
             */
            await vehicleRepository.softDelete(
                vehicle._id
            );

            throw new AppError(
                "Driver could not be linked to vehicle.",
                500
            );
        }


        const updatedDriver =
            await driverRepository.updateById(
                driver._id,
                {
                    currentVehicle:
                        vehicle._id,

                    updatedBy:
                        userId,
                }
            );


        if (!updatedDriver) {

            /*
             * Defensive rollback.
             */
            await vehicleRepository.updateById(
                vehicle._id,
                {
                    currentDriver: null,
                    status:
                        VEHICLE_STATUS.AVAILABLE,
                    updatedBy:
                        userId,
                }
            );

            await vehicleRepository.softDelete(
                vehicle._id
            );

            throw new AppError(
                "Failed to synchronize driver with vehicle.",
                500
            );
        }
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


    /*
     * Vendor Validation
     */
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


    /*
     * Vehicle Number Validation
     */
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


    /*
     * Detect whether currentDriver
     * was explicitly changed.
     *
     * This also handles:
     *
     * currentDriver: null
     */
    const driverWasUpdated =
        Object.prototype.hasOwnProperty.call(
            updateData,
            "currentDriver"
        );


    const oldDriverId =
        vehicle.currentDriver?._id ||
        vehicle.currentDriver ||
        null;


    const newDriverId =
        driverWasUpdated
            ? updateData.currentDriver
            : oldDriverId;


    /*
     * Determine effective vendor.
     */
    const effectiveVendorId =
        updateData.vendor ||
        vehicle.vendor?._id ||
        vehicle.vendor;


    /*
     * Validate new Driver.
     */
    if (newDriverId) {

        const driver =
            await driverRepository.findById(
                newDriverId
            );

        if (!driver) {
            throw new AppError(
                "Driver not found.",
                404
            );
        }


        const driverVendorId =
            driver.vendor?._id ||
            driver.vendor;


        if (
            !effectiveVendorId ||
            !driverVendorId ||
            effectiveVendorId.toString() !==
                driverVendorId.toString()
        ) {
            throw new AppError(
                "Driver must belong to the selected vendor.",
                400
            );
        }


        /*
         * Prevent assigning a driver that
         * already belongs to another vehicle.
         */
        if (
            driver.currentVehicle &&
            driver.currentVehicle.toString() !==
                vehicleId.toString()
        ) {

            throw new AppError(
                "Driver is already assigned to another vehicle.",
                409
            );
        }


        const assignedVehicle =
            await vehicleRepository.findByCurrentDriver(
                newDriverId
            );

        if (
            assignedVehicle &&
            assignedVehicle._id.toString() !==
                vehicleId.toString()
        ) {

            throw new AppError(
                "Driver is already assigned to another vehicle.",
                409
            );
        }


        /*
         * Vehicle with a driver must be
         * ASSIGNED or ON_DUTY.
         *
         * Do not silently allow AVAILABLE.
         */
        if (
            updateData.status ===
                VEHICLE_STATUS.AVAILABLE
        ) {

            throw new AppError(
                "A vehicle with an assigned driver cannot have AVAILABLE status.",
                400
            );
        }


        /*
         * If no status was supplied while
         * assigning a driver, use ASSIGNED.
         */
        if (
            driverWasUpdated &&
            !Object.prototype.hasOwnProperty.call(
                updateData,
                "status"
            )
        ) {

            updateData.status =
                VEHICLE_STATUS.ASSIGNED;
        }
    }


    /*
     * Do not allow changing vendor while
     * keeping a driver belonging to the
     * old vendor.
     */
    if (
        updateData.vendor &&
        newDriverId
    ) {

        const driver =
            await driverRepository.findById(
                newDriverId
            );

        const driverVendorId =
            driver?.vendor?._id ||
            driver?.vendor;


        if (
            !driverVendorId ||
            driverVendorId.toString() !==
                updateData.vendor.toString()
        ) {

            throw new AppError(
                "Vehicle vendor must match the assigned driver's vendor.",
                400
            );
        }
    }


    /*
     * Do not allow AVAILABLE status while
     * a driver remains assigned.
     */
    if (
        updateData.status ===
            VEHICLE_STATUS.AVAILABLE &&
        newDriverId
    ) {

        throw new AppError(
            "Cannot mark a vehicle AVAILABLE while a driver is assigned.",
            400
        );
    }


    /*
     * If vehicle has an active driver,
     * prevent manually changing it to
     * MAINTENANCE/INACTIVE.
     *
     * Driver must first be unassigned.
     */
    if (
        oldDriverId &&
        !driverWasUpdated &&
        updateData.status &&
        (
            updateData.status ===
                VEHICLE_STATUS.MAINTENANCE ||
            updateData.status ===
                VEHICLE_STATUS.INACTIVE
        )
    ) {

        throw new AppError(
            "Cannot change an assigned vehicle to maintenance or inactive status. Unassign the driver first.",
            400
        );
    }


    updateData.updatedBy =
        userId;


    /*
     * Update Vehicle.
     */
    const updatedVehicle =
        await vehicleRepository.updateById(
            vehicleId,
            updateData
        );


    if (!updatedVehicle) {
        throw new AppError(
            "Failed to update vehicle.",
            500
        );
    }


    /*
     * Synchronize Driver ↔ Vehicle
     */
    if (driverWasUpdated) {

        /*
         * Driver was removed from vehicle.
         */
        if (
            oldDriverId &&
            !newDriverId
        ) {

            const oldDriver =
                await driverRepository.findById(
                    oldDriverId
                );

            if (
                oldDriver &&
                oldDriver.currentVehicle &&
                oldDriver.currentVehicle.toString() ===
                    vehicleId.toString()
            ) {

                await driverRepository.updateById(
                    oldDriverId,
                    {
                        currentVehicle:
                            null,

                        updatedBy:
                            userId,
                    }
                );
            }
        }


        /*
         * Driver changed from one vehicle
         * to another.
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
             * Clear old driver's vehicle.
             */
            if (oldDriverId) {

                const oldDriver =
                    await driverRepository.findById(
                        oldDriverId
                    );

                if (
                    oldDriver &&
                    oldDriver.currentVehicle &&
                    oldDriver.currentVehicle.toString() ===
                        vehicleId.toString()
                ) {

                    await driverRepository.updateById(
                        oldDriverId,
                        {
                            currentVehicle:
                                null,

                            updatedBy:
                                userId,
                        }
                    );
                }
            }


            /*
             * Assign new driver's vehicle.
             */
            const newDriver =
                await driverRepository.findById(
                    newDriverId
                );

            if (!newDriver) {

                throw new AppError(
                    "Driver synchronization failed after vehicle update.",
                    500
                );
            }


            await driverRepository.updateById(
                newDriverId,
                {
                    currentVehicle:
                        vehicleId,

                    updatedBy:
                        userId,
                }
            );
        }
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


    /*
     * Do not delete a vehicle while
     * it is assigned to a driver.
     */
    if (vehicle.currentDriver) {

        throw new AppError(
            "Cannot delete a vehicle while a driver is assigned. Unassign the driver first.",
            400
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


    /*
     * Prevent invalid status transitions
     * while a driver is assigned.
     */
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


    return vehicleRepository.updateById(
        vehicleId,
        {
            status,
            updatedBy: userId,
        }
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