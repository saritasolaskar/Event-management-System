const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");

const eventRepository = require("../repositories/event.repository");
const vendorRepository = require("../repositories/vendor.repository");
const driverRepository = require("../repositories/driver.repository");
const vehicleRepository = require("../repositories/vehicle.repository");
const locationRepository = require("../repositories/location.repository");

const AppError = require("../utils/appError");

/**
 * Create Vehicle Assignment
 */
const createVehicleAssignment = async (data, userId) => {

    const event = await eventRepository.findById(data.event);

    if (!event) {
        throw new AppError("Event not found.", 404);
    }

    const vendor = await vendorRepository.findById(data.vendor);

    if (!vendor) {
        throw new AppError("Vendor not found.", 404);
    }

    const driver = await driverRepository.findById(data.driver);

    if (!driver) {
        throw new AppError("Driver not found.", 404);
    }

    const vehicle = await vehicleRepository.findById(data.vehicle);

    if (!vehicle) {
        throw new AppError("Vehicle not found.", 404);
    }

    if (data.reportingLocation) {

        const location = await locationRepository.findById(
            data.reportingLocation
        );

        if (!location) {
            throw new AppError(
                "Reporting location not found.",
                404
            );
        }
    }

    data.createdBy = userId;
    data.updatedBy = userId;

    return await vehicleAssignmentRepository.create(data);
};

/**
 * Get All Assignments
 */
const getAllVehicleAssignments = async () => {

    return await vehicleAssignmentRepository.findAll();
};

/**
 * Get Assignment By ID
 */
const getVehicleAssignmentById = async (id) => {

    const assignment =
        await vehicleAssignmentRepository.findById(id);

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

    updateData.updatedBy = userId;

    return await vehicleAssignmentRepository.updateById(
        id,
        updateData
    );
};

/**
 * Delete Assignment
 */
const deleteVehicleAssignment = async (id) => {

    const assignment =
        await vehicleAssignmentRepository.findById(id);

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    await vehicleAssignmentRepository.softDelete(id);
};

/**
 * Update Assignment Status
 */
const updateVehicleAssignmentStatus = async (
    id,
    status
) => {

    const assignment =
        await vehicleAssignmentRepository.findById(id);

    if (!assignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    return await vehicleAssignmentRepository.updateById(
        id,
        {
            status,
        }
    );
};

module.exports = {
    createVehicleAssignment,
    getAllVehicleAssignments,
    getVehicleAssignmentById,
    updateVehicleAssignment,
    deleteVehicleAssignment,
    updateVehicleAssignmentStatus,
};