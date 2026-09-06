const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");

const eventRepository = require("../repositories/event.repository");
const vendorRepository = require("../repositories/vendor.repository");
const driverRepository = require("../repositories/driver.repository");
const vehicleRepository = require("../repositories/vehicle.repository");
const locationRepository = require("../repositories/location.repository");

const notificationService = require("./notification.service");
const auditLogService = require("./auditLog.service");

const AppError = require("../utils/AppError");

/**
 * Create Vehicle Assignment
 */
const createVehicleAssignment = async (
    data,
    userId
) => {

    const event =
        await eventRepository.findById(
            data.event
        );

    if (!event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

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

    const driver =
        await driverRepository.findById(
            data.driver
        );

    if (!driver) {
        throw new AppError(
            "Driver not found.",
            404
        );
    }

    if (
        driver.vendor.toString() !==
        vendor._id.toString()
    ) {
        throw new AppError(
            "Driver does not belong to the selected vendor.",
            400
        );
    }

    const vehicle =
        await vehicleRepository.findById(
            data.vehicle
        );

    if (!vehicle) {
        throw new AppError(
            "Vehicle not found.",
            404
        );
    }

    if (
        vehicle.vendor.toString() !==
        vendor._id.toString()
    ) {
        throw new AppError(
            "Vehicle does not belong to the selected vendor.",
            400
        );
    }

    if (data.reportingLocation) {

        const location =
            await locationRepository.findById(
                data.reportingLocation
            );

        if (!location) {
            throw new AppError(
                "Reporting location not found.",
                404
            );
        }

    }

    const existingDriverAssignment =
        await vehicleAssignmentRepository.findActiveByDriver(
            data.driver
        );

    if (existingDriverAssignment) {
        throw new AppError(
            "Driver is already assigned.",
            409
        );
    }

    const existingVehicleAssignment =
        await vehicleAssignmentRepository.findActiveByVehicle(
            data.vehicle
        );

    if (existingVehicleAssignment) {
        throw new AppError(
            "Vehicle is already assigned.",
            409
        );
    }

    data.createdBy = userId;
    data.updatedBy = userId;

    const assignment =
        await vehicleAssignmentRepository.create(
            data
        );

    await notificationService.createNotification({

        recipientUser: userId,

        title: "Vehicle Assigned",

        message: `Vehicle assigned successfully for Event ${event.eventCode}.`,

        type: "VEHICLE_ASSIGNED",

        referenceType: "VEHICLE_ASSIGNMENT",

        referenceId: assignment._id,

    });

    await auditLogService.createLog({

        user: userId,

        action: "CREATE",

        module: "VEHICLE_ASSIGNMENT",

        referenceId: assignment._id,

        description: `Assigned vehicle ${vehicle.registrationNumber} to driver ${driver.firstName} ${driver.lastName}.`,

    });

    return assignment;

};

/**
 * Get All Assignments
 */
const getAllVehicleAssignments = async () => {

    return vehicleAssignmentRepository.findAll();

};

/**
 * Get Assignment By ID
 */
const getVehicleAssignmentById = async (
    id
) => {

    const assignment =
        await vehicleAssignmentRepository.findById(
            id
        );

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    return assignment;

};

/**
 * Update Assignment
 */
const updateVehicleAssignment = async (
    id,
    updateData,
    userId
) => {

    const assignment =
        await vehicleAssignmentRepository.findById(id);

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    if (updateData.driver) {

        const driver =
            await driverRepository.findById(
                updateData.driver
            );

        if (!driver) {
            throw new AppError(
                "Driver not found.",
                404
            );
        }

        if (
            driver.vendor.toString() !==
            assignment.vendor._id.toString()
        ) {
            throw new AppError(
                "Driver does not belong to the selected vendor.",
                400
            );
        }

        const existingDriverAssignment =
            await vehicleAssignmentRepository.findActiveByDriver(
                updateData.driver,
                id
            );

        if (existingDriverAssignment) {
            throw new AppError(
                "Driver is already assigned.",
                409
            );
        }

    }

    if (updateData.vehicle) {

        const vehicle =
            await vehicleRepository.findById(
                updateData.vehicle
            );

        if (!vehicle) {
            throw new AppError(
                "Vehicle not found.",
                404
            );
        }

        if (
            vehicle.vendor.toString() !==
            assignment.vendor._id.toString()
        ) {
            throw new AppError(
                "Vehicle does not belong to the selected vendor.",
                400
            );
        }

        const existingVehicleAssignment =
            await vehicleAssignmentRepository.findActiveByVehicle(
                updateData.vehicle,
                id
            );

        if (existingVehicleAssignment) {
            throw new AppError(
                "Vehicle is already assigned.",
                409
            );
        }

    }

    if (updateData.reportingLocation) {

        const location =
            await locationRepository.findById(
                updateData.reportingLocation
            );

        if (!location) {
            throw new AppError(
                "Reporting location not found.",
                404
            );
        }

    }

    updateData.updatedBy = userId;

    const updatedAssignment =
        await vehicleAssignmentRepository.updateById(
            id,
            updateData
        );

    await auditLogService.createLog({

        user: userId,

        action: "UPDATE",

        module: "VEHICLE_ASSIGNMENT",

        referenceId: updatedAssignment._id,

        description: "Vehicle Assignment updated.",

    });

    return updatedAssignment;

};

/**
 * Delete Assignment
 */
const deleteVehicleAssignment = async (
    id,
    userId
) => {

    const assignment =
        await vehicleAssignmentRepository.findById(
            id
        );

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    await vehicleAssignmentRepository.softDelete(id);

    await auditLogService.createLog({

        user: userId,

        action: "DELETE",

        module: "VEHICLE_ASSIGNMENT",

        referenceId: assignment._id,

        description: "Vehicle Assignment deleted.",

    });

    return {
        message:
            "Vehicle Assignment deleted successfully."
    };

};

/**
 * Update Assignment Status
 */
const updateVehicleAssignmentStatus = async (
    id,
    status,
    userId
) => {

    const assignment =
        await vehicleAssignmentRepository.findById(
            id
        );

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    const updatedAssignment =
        await vehicleAssignmentRepository.updateById(
            id,
            { status }
        );

    await notificationService.createNotification({

        recipientUser: userId,

        title: "Vehicle Assignment Status Updated",

        message: `Vehicle assignment status updated to ${status}.`,

        type: "SYSTEM",

        referenceType: "VEHICLE_ASSIGNMENT",

        referenceId: updatedAssignment._id,

    });

    await auditLogService.createLog({

        user: userId,

        action: "UPDATE",

        module: "VEHICLE_ASSIGNMENT",

        referenceId: updatedAssignment._id,

        description: `Vehicle assignment status changed to ${status}.`,

    });

    return updatedAssignment;

};

module.exports = {

    createVehicleAssignment,

    getAllVehicleAssignments,

    getVehicleAssignmentById,

    updateVehicleAssignment,

    deleteVehicleAssignment,

    updateVehicleAssignmentStatus,

};