const mongoose = require("mongoose");

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
    EVENT_STATUS,
} = require("../constants/status");


const validateDriverForAssignment = async (
    driverId,
    vendorId,
    session = null
) => {

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

    if (driver.status !== STATUS.ACTIVE) {
        throw new AppError(
            `Driver cannot be assigned because driver status is ${driver.status}.`,
            400
        );
    }

    const driverVendor =
        driver.vendor?._id ||
        driver.vendor;

    if (
        !driverVendor ||
        driverVendor.toString() !==
            vendorId.toString()
    ) {
        throw new AppError(
            "Driver does not belong to the selected vendor.",
            400
        );
    }

    return driver;
};


const validateVehicleForAssignment = async (
    vehicleId,
    vendorId,
    session = null
) => {

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

    const vehicleVendor =
        vehicle.vendor?._id ||
        vehicle.vendor;

    if (
        !vehicleVendor ||
        vehicleVendor.toString() !==
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


const validateEvent = async (
    eventId,
    session = null
) => {

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
        event.status ===
        EVENT_STATUS.CANCELLED
    ) {
        throw new AppError(
            "Vehicle cannot be assigned to a cancelled event.",
            400
        );
    }

    if (
        event.status ===
        EVENT_STATUS.COMPLETED
    ) {
        throw new AppError(
            "Vehicle cannot be assigned to a completed event.",
            400
        );
    }

    return event;
};


const validateCommercialPackage = async (
    packageId,
    session = null
) => {

    const commercialPackage =
        await commercialPackageRepository.findById(
            packageId,
            session
        );

    if (!commercialPackage) {
        throw new AppError(
            "Commercial Package not found.",
            404
        );
    }

    if (
        !commercialPackage.isActive ||
        commercialPackage.isDeleted
    ) {
        throw new AppError(
            "Commercial Package is inactive.",
            400
        );
    }

    return commercialPackage;
};


const validateReportingLocation = async (
    locationId,
    session = null
) => {

    if (!locationId) {
        return null;
    }

    const location =
        await locationRepository.findById(
            locationId,
            session
        );

    if (!location) {
        throw new AppError(
            "Reporting location not found.",
            404
        );
    }

    return location;
};


/**
 * Create Vehicle Assignment
 */
const createVehicleAssignment = async (
    data,
    userId
) => {

    const session =
        await mongoose.startSession();

    let assignment;
    let event;
    let vehicle;
    let driver;

    try {

        await session.withTransaction(
            async () => {

                event =
                    await validateEvent(
                        data.event,
                        session
                    );

                const commercialPackage =
                    await validateCommercialPackage(
                        data.commercialPackage,
                        session
                    );

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

                if (
                    vendor.status !==
                    STATUS.ACTIVE
                ) {
                    throw new AppError(
                        "Vendor is not active.",
                        400
                    );
                }

                driver =
                    await validateDriverForAssignment(
                        data.driver,
                        vendor._id,
                        session
                    );

                vehicle =
                    await validateVehicleForAssignment(
                        data.vehicle,
                        vendor._id,
                        session
                    );

                await validateReportingLocation(
                    data.reportingLocation,
                    session
                );

                const existingDriverAssignment =
                    await vehicleAssignmentRepository.findActiveByDriver(
                        data.driver,
                        null,
                        session
                    );

                if (existingDriverAssignment) {
                    throw new AppError(
                        "Driver is already assigned.",
                        409
                    );
                }

                const existingVehicleAssignment =
                    await vehicleAssignmentRepository.findActiveByVehicle(
                        data.vehicle,
                        null,
                        session
                    );

                if (existingVehicleAssignment) {
                    throw new AppError(
                        "Vehicle is already assigned.",
                        409
                    );
                }

                const assignmentData = {
                    ...data,

                    commercialPackageSnapshot: {
                        name:
                            commercialPackage.name,

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
                    },

                    createdBy:
                        userId,

                    updatedBy:
                        userId,
                };

                try {

                    assignment =
                        await vehicleAssignmentRepository.create(
                            assignmentData,
                            session
                        );

                } catch (error) {

                    if (
                        error.code ===
                        11000
                    ) {
                        throw new AppError(
                            "Driver or vehicle is already assigned to another active assignment.",
                            409
                        );
                    }

                    throw error;
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
            "Vehicle Assigned",

        message:
            `Vehicle assigned successfully for Event ${event.eventCode}.`,

        type:
            "VEHICLE_ASSIGNED",

        referenceType:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            assignment._id,
    });


    await auditLogService.createLog({

        user:
            userId,

        action:
            "CREATE",

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
        assignment.status ===
            "ON_DUTY" ||
        assignment.status ===
            "COMPLETED" ||
        assignment.status ===
            "CANCELLED"
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be modified after duty has started.",
            400
        );
    }

    const allowedFields = [
        "vehicle",
        "driver",
        "reportingLocation",
        "reportingTime",
        "remarks",
    ];

    const sanitizedUpdateData = {};

    for (
        const field of allowedFields
    ) {

        if (
            updateData[field] !==
            undefined
        ) {
            sanitizedUpdateData[field] =
                updateData[field];
        }
    }

    updateData =
        sanitizedUpdateData;


    const vendorId =
        assignment.vendor?._id ||
        assignment.vendor;


    if (!vendorId) {
        throw new AppError(
            "Vendor not found for this assignment.",
            400
        );
    }


    if (updateData.driver) {

        await validateDriverForAssignment(
            updateData.driver,
            vendorId
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


    if (updateData.vehicle) {

        await validateVehicleForAssignment(
            updateData.vehicle,
            vendorId
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


    if (!updateData.driver) {

        await validateDriverForAssignment(
            assignment.driver._id ||
                assignment.driver,
            vendorId
        );
    }


    if (!updateData.vehicle) {

        await validateVehicleForAssignment(
            assignment.vehicle._id ||
                assignment.vehicle,
            vendorId
        );
    }


    if (
        updateData.reportingLocation
    ) {

        await validateReportingLocation(
            updateData.reportingLocation
        );
    }


    updateData.updatedBy =
        userId;


    const expectedStatus =
        assignment.status;

    let updatedAssignment;

    try {

        updatedAssignment =
            await vehicleAssignmentRepository.updateByIdAndStatus(
                id,
                expectedStatus,
                updateData
            );

    } catch (error) {

        if (
            error.code ===
            11000
        ) {
            throw new AppError(
                "Driver or vehicle is already assigned to another active assignment.",
                409
            );
        }

        throw error;
    }


    if (!updatedAssignment) {
        throw new AppError(
            "Vehicle Assignment was changed by another operation. Please refresh and try again.",
            409
        );
    }


    await auditLogService.createLog({

        user:
            userId,

        action:
            "UPDATE",

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
        assignment.status ===
            "ON_DUTY" ||
        assignment.status ===
            "COMPLETED" ||
        assignment.status ===
            "CANCELLED"
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be deleted after duty has started.",
            400
        );
    }

    const deletedAssignment =
        await vehicleAssignmentRepository.softDeleteByStatus(
            id,
            assignment.status,
            userId
        );

    if (!deletedAssignment) {
        throw new AppError(
            "Vehicle Assignment was changed by another operation. Please refresh and try again.",
            409
        );
    }

    await auditLogService.createLog({

        user:
            userId,

        action:
            "DELETE",

        module:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            assignment._id,

        description:
            "Vehicle Assignment deleted.",
    });

    return {
        message:
            "Vehicle Assignment deleted successfully.",
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

    if (
        status !== "CANCELLED"
    ) {
        throw new AppError(
            "Only cancellation is allowed through the manual status endpoint.",
            400
        );
    }

    if (
        assignment.status ===
        "ON_DUTY"
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be cancelled after duty has started.",
            400
        );
    }

    if (
        assignment.status ===
            "COMPLETED" ||
        assignment.status ===
            "CANCELLED"
    ) {
        throw new AppError(
            `Cannot cancel an assignment with status ${assignment.status}.`,
            400
        );
    }

    const expectedStatus =
        assignment.status;

    let updatedAssignment;

    try {

        updatedAssignment =
            await vehicleAssignmentRepository.updateByIdAndStatus(
                id,
                expectedStatus,
                {
                    status:
                        "CANCELLED",

                    updatedBy:
                        userId,
                }
            );

    } catch (error) {

        if (
            error.code ===
            11000
        ) {
            throw new AppError(
                "Driver or vehicle is already assigned to another active assignment.",
                409
            );
        }

        throw error;
    }


    if (!updatedAssignment) {
        throw new AppError(
            "Vehicle Assignment was changed by another operation. Please refresh and try again.",
            409
        );
    }


    await notificationService.createNotification({

        recipientUser:
            userId,

        title:
            "Vehicle Assignment Cancelled",

        message:
            "Vehicle assignment has been cancelled.",

        type:
            "VEHICLE_ASSIGNMENT_CANCELLED",

        referenceType:
            "VEHICLE_ASSIGNMENT",

        referenceId:
            updatedAssignment._id,
    });


    await auditLogService.createLog({

        user:
            userId,

        action:
            "UPDATE",

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