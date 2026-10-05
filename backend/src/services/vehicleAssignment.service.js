const mongoose = require("mongoose");
const crypto = require("crypto");

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

const guestAssignmentRepository =
    require("../repositories/guestAssignment.repository");

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


/**
 * Generate a unique Vehicle Assignment code.
 *
 * Example:
 * VA-20261002-A7F39C21
 */
const generateAssignmentCode = () => {
    const datePart = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");

    const randomPart = crypto
        .randomBytes(4)
        .toString("hex")
        .toUpperCase();

    return `VA-${datePart}-${randomPart}`;
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


const validateDriverForAssignment = async (
    driverId,
    vendorId,
    vehicleId = null,
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

    if (
        driver.status !==
        STATUS.ACTIVE
    ) {
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


const validateVehicleForAssignment = async (
    vehicleId,
    vendorId,
    driverId = null,
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

    if (
        vehicle.status !==
        VEHICLE_STATUS.ASSIGNED
    ) {
        throw new AppError(
            "Only a vehicle with an assigned driver can be used for a vehicle assignment.",
            400
        );
    }

    if (
        driverId &&
        getId(vehicle.currentDriver) !==
            getId(driverId)
    ) {
        throw new AppError(
            "Selected vehicle is assigned to a different driver.",
            409
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
                        data.vehicle,
                        session
                    );

                vehicle =
                    await validateVehicleForAssignment(
                        data.vehicle,
                        vendor._id,
                        data.driver,
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

                    assignmentCode:
                        generateAssignmentCode(),

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
                            "Driver, vehicle, or assignment code is already in use.",
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
            `Assigned vehicle ${vehicle.vehicleNumber} to driver ${driver.firstName} ${driver.lastName}.`,
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
        assignment.status === "COMPLETED" ||
        assignment.status === "CANCELLED"
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

    const effectiveDriverId =
        updateData.driver ||
        getId(assignment.driver);

    const effectiveVehicleId =
        updateData.vehicle ||
        getId(assignment.vehicle);

    await validateDriverForAssignment(
        effectiveDriverId,
        vendorId,
        effectiveVehicleId
    );

    await validateVehicleForAssignment(
        effectiveVehicleId,
        vendorId,
        effectiveDriverId
    );

    if (updateData.driver) {
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

    if (
        updateData.reportingLocation
    ) {
        await validateReportingLocation(
            updateData.reportingLocation
        );
    }

    updateData.updatedBy =
        userId;

    const driverWasUpdated =
        Object.prototype.hasOwnProperty.call(
            updateData,
            "driver"
        );

    const vehicleWasUpdated =
        Object.prototype.hasOwnProperty.call(
            updateData,
            "vehicle"
        );

    const oldDriverId =
        getId(assignment.driver);

    const oldVehicleId =
        getId(assignment.vehicle);

    const newDriverId =
        getId(
            updateData.driver ||
            oldDriverId
        );

    const newVehicleId =
        getId(
            updateData.vehicle ||
            oldVehicleId
        );

    const session =
        await mongoose.startSession();

    let updatedAssignment;

    try {
        await session.withTransaction(
            async () => {

                updatedAssignment =
                    await vehicleAssignmentRepository.updateByIdAndStatus(
                        id,
                        assignment.status,
                        updateData,
                        session
                    );

                if (!updatedAssignment) {
                    throw new AppError(
                        "Vehicle Assignment was changed by another operation. Please refresh and try again.",
                        409
                    );
                }

                /*
                 * If the driver changes, release the
                 * old driver's vehicle relationship.
                 */
                if (
                    driverWasUpdated &&
                    oldDriverId !== newDriverId
                ) {
                    const oldDriver =
                        await driverRepository.findById(
                            oldDriverId,
                            session
                        );

                    if (
                        oldDriver &&
                        getId(
                            oldDriver.currentVehicle
                        ) === oldVehicleId
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
                 * If the vehicle changes, release the
                 * old vehicle relationship.
                 */
                if (
                    vehicleWasUpdated &&
                    oldVehicleId !== newVehicleId
                ) {
                    const oldVehicle =
                        await vehicleRepository.findById(
                            oldVehicleId,
                            session
                        );

                    if (
                        oldVehicle &&
                        getId(
                            oldVehicle.currentDriver
                        ) === oldDriverId
                    ) {
                        await vehicleRepository.updateById(
                            oldVehicleId,
                            {
                                currentDriver:
                                    null,

                                status:
                                    VEHICLE_STATUS.AVAILABLE,

                                updatedBy:
                                    userId,
                            },
                            session
                        );
                    }
                }

                /*
                 * Ensure the new driver points to
                 * the vehicle used by this assignment.
                 */
                if (
                    newDriverId &&
                    (
                        driverWasUpdated ||
                        vehicleWasUpdated
                    )
                ) {
                    const linkedDriver =
                        await driverRepository.findById(
                            newDriverId,
                            session
                        );

                    if (!linkedDriver) {
                        throw new AppError(
                            "Driver not found while synchronizing vehicle assignment.",
                            404
                        );
                    }

                    if (
                        getId(
                            linkedDriver.currentVehicle
                        ) !== newVehicleId
                    ) {
                        await driverRepository.updateById(
                            newDriverId,
                            {
                                currentVehicle:
                                    newVehicleId,

                                updatedBy:
                                    userId,
                            },
                            session
                        );
                    }
                }

                /*
                 * Ensure the new vehicle points to
                 * the driver used by this assignment.
                 */
                if (
                    newVehicleId &&
                    (
                        driverWasUpdated ||
                        vehicleWasUpdated
                    )
                ) {
                    const linkedVehicle =
                        await vehicleRepository.findById(
                            newVehicleId,
                            session
                        );

                    if (!linkedVehicle) {
                        throw new AppError(
                            "Vehicle not found while synchronizing vehicle assignment.",
                            404
                        );
                    }

                    if (
                        getId(
                            linkedVehicle.currentDriver
                        ) !== newDriverId
                    ) {
                        await vehicleRepository.updateById(
                            newVehicleId,
                            {
                                currentDriver:
                                    newDriverId,

                                status:
                                    VEHICLE_STATUS.ASSIGNED,

                                updatedBy:
                                    userId,
                            },
                            session
                        );
                    }
                }
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
    } finally {
        await session.endSession();
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
        assignment.status === "ON_DUTY" ||
        assignment.status === "COMPLETED" ||
        assignment.status === "CANCELLED"
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be deleted after duty has started.",
            400
        );
    }

    /*
     * A vehicle assignment cannot be deleted
     * while guests are still assigned to it.
     */
    const guestAssignments =
        await guestAssignmentRepository.findByVehicleAssignment(
            id
        );

    if (
        guestAssignments.length > 0
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be deleted because guests are assigned to it.",
            409
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
        assignment.status === "COMPLETED" ||
        assignment.status === "CANCELLED"
    ) {
        throw new AppError(
            `Cannot cancel an assignment with status ${assignment.status}.`,
            400
        );
    }

    /*
     * A vehicle assignment cannot be cancelled
     * while guests are still assigned to it.
     */
    const guestAssignments =
        await guestAssignmentRepository.findByVehicleAssignment(
            id
        );

    if (
        guestAssignments.length > 0
    ) {
        throw new AppError(
            "Vehicle Assignment cannot be cancelled because guests are assigned to it.",
            409
        );
    }

    const expectedStatus =
        assignment.status;

    const updatedAssignment =
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
            "Vehicle Assignment cancelled.",
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