const vehicleAssignmentRepository =
    require("../repositories/vehicleAssignment.repository");

const eventRepository =
    require("../repositories/event.repository");

const vendorRepository =
    require("../repositories/vendor.repository");

const driverRepository =
    require("../repositories/driver.repository");

const vehicleRepository =
    require("../repositories/vehicle.repository");

const locationRepository =
    require("../repositories/location.repository");

const commercialPackageRepository =
    require("../repositories/commercialPackage.repository");

const notificationService =
    require("./notification.service");

const auditLogService =
    require("./auditLog.service");

const AppError =
    require("../utils/AppError");

const {
    STATUS,
    VEHICLE_STATUS,
} = require("../constants/status");


/**
 * Validate driver for vehicle assignment.
 */
const validateDriverForAssignment = async (
    driverId,
    vendorId
) => {

    const driver =
        await driverRepository.findById(
            driverId
        );

    if (!driver) {
        throw new AppError(
            "Driver not found.",
            404
        );
    }

    if (driver.status !== STATUS.ACTIVE) {
        throw new AppError(
            `Driver cannot be assigned because driver status is ${driver.status}.`,
            400
        );
    }

    if (
        driver.vendor.toString() !==
        vendorId.toString()
    ) {
        throw new AppError(
            "Driver does not belong to the selected vendor.",
            400
        );
    }

    return driver;
};


/**
 * Validate vehicle for vehicle assignment.
 */
const validateVehicleForAssignment = async (
    vehicleId,
    vendorId
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
        vehicle.vendor.toString() !==
        vendorId.toString()
    ) {
        throw new AppError(
            "Vehicle does not belong to the selected vendor.",
            400
        );
    }

    const allowedStatuses = [
        VEHICLE_STATUS.AVAILABLE,
        VEHICLE_STATUS.ASSIGNED,
    ];

    if (
        !allowedStatuses.includes(
            vehicle.status
        )
    ) {
        throw new AppError(
            `Vehicle cannot be assigned because vehicle status is ${vehicle.status}.`,
            400
        );
    }

    return vehicle;
};


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

    const commercialPackage =
        await commercialPackageRepository.findById(
            data.commercialPackage
        );

    if (!commercialPackage) {
        throw new AppError(
            "Commercial Package not found.",
            404
        );
    }

    if (!commercialPackage.isActive) {
        throw new AppError(
            "Commercial Package is inactive.",
            400
        );
    }

    /*
     * Snapshot the commercial package rates at the time
     * of vehicle assignment creation.
     *
     * This protects historical billing from future
     * changes to the master commercial package.
     */
    data.commercialPackageSnapshot = {
        name: commercialPackage.name,

        vendorBaseRate:
            commercialPackage.vendorBaseRate,

        vendorIncludedKm:
            commercialPackage.vendorIncludedKm,

        vendorExtraKmRate:
            commercialPackage.vendorExtraKmRate,

        vendorIncludedHours:
            commercialPackage.vendorIncludedHours,

        vendorExtraHourRate:
            commercialPackage.vendorExtraHourRate,

        clientBaseRate:
            commercialPackage.clientBaseRate,

        clientIncludedKm:
            commercialPackage.clientIncludedKm,

        clientExtraKmRate:
            commercialPackage.clientExtraKmRate,

        clientIncludedHours:
            commercialPackage.clientIncludedHours,

        clientExtraHourRate:
            commercialPackage.clientExtraHourRate,
    };

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
        await validateDriverForAssignment(
            data.driver,
            vendor._id
        );

    const vehicle =
        await validateVehicleForAssignment(
            data.vehicle,
            vendor._id
        );

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

        message:
            `Vehicle assigned successfully for Event ${event.eventCode}.`,

        type: "VEHICLE_ASSIGNED",

        referenceType:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            assignment._id,

    });

    await auditLogService.createLog({

        user: userId,

        action: "CREATE",

        module:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            assignment._id,

        description:
            `Assigned vehicle ${vehicle.registrationNumber} to driver ${driver.firstName} ${driver.lastName}.`,

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
        await vehicleAssignmentRepository.findById(
            id
        );

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    if (
        assignment.status === "ON_DUTY" ||
        assignment.status === "COMPLETED"
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be modified after duty has started.",
            400
        );
    }

    /*
     * Commercial package is intentionally NOT included
     * here because the package and its rates are frozen
     * when the assignment is created.
     */
    const allowedFields = [
        "vehicle",
        "driver",
        "reportingLocation",
        "reportingTime",
        "remarks",
    ];

    const sanitizedUpdateData = {};

    for (const field of allowedFields) {

        if (
            updateData[field] !== undefined
        ) {
            sanitizedUpdateData[field] =
                updateData[field];
        }
    }

    updateData =
        sanitizedUpdateData;


    /*
     * Validate driver when changing driver.
     */
    if (updateData.driver) {

        const driver =
            await validateDriverForAssignment(
                updateData.driver,
                assignment.vendor._id
            );

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


    /*
     * Validate vehicle when changing vehicle.
     */
    if (updateData.vehicle) {

        const vehicle =
            await validateVehicleForAssignment(
                updateData.vehicle,
                assignment.vendor._id
            );

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


    /*
     * Also validate the existing driver/vehicle when
     * assignment is being updated without replacing them.
     *
     * This prevents an assignment from being edited while
     * its linked driver or vehicle has become unusable.
     */
    if (!updateData.driver) {

        await validateDriverForAssignment(
            assignment.driver._id,
            assignment.vendor._id
        );
    }


    if (!updateData.vehicle) {

        await validateVehicleForAssignment(
            assignment.vehicle._id,
            assignment.vendor._id
        );
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

    updateData.updatedBy =
        userId;

    const updatedAssignment =
        await vehicleAssignmentRepository.updateById(
            id,
            updateData
        );

    await auditLogService.createLog({

        user: userId,

        action: "UPDATE",

        module:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            updatedAssignment._id,

        description:
            "Vehicle Assignment updated.",

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

    if (
        assignment.status === "ON_DUTY" ||
        assignment.status === "COMPLETED"
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be deleted after duty has started.",
            400
        );
    }

    await vehicleAssignmentRepository.softDelete(
        id
    );

    await auditLogService.createLog({

        user: userId,

        action: "DELETE",

        module:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            assignment._id,

        description:
            "Vehicle Assignment deleted.",

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

    if (status !== "CANCELLED") {
        throw new AppError(
            "Only cancellation is allowed through the manual status endpoint.",
            400
        );
    }

    /*
     * Once duty has started, assignment cancellation
     * must happen through the duty lifecycle.
     */
    if (
        assignment.status === "ON_DUTY"
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be cancelled after duty has started.",
            400
        );
    }

    if (
        assignment.status === "COMPLETED" ||
        assignment.status === "CANCELLED"
    ) {
        throw new AppError(
            `Cannot cancel an assignment with status ${assignment.status}.`,
            400
        );
    }

    const updatedAssignment =
        await vehicleAssignmentRepository.updateById(
            id,
            {
                status: "CANCELLED",
                updatedBy: userId,
            }
        );

    await notificationService.createNotification({

        recipientUser: userId,

        title:
            "Vehicle Assignment Cancelled",

        message:
            "Vehicle assignment has been cancelled.",

        type:
            "SYSTEM",

        referenceType:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            updatedAssignment._id,

    });

    await auditLogService.createLog({

        user: userId,

        action: "UPDATE",

        module:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            updatedAssignment._id,

        description:
            "Vehicle assignment cancelled.",

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