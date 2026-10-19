
const mongoose = require("mongoose");

const vehicleRepository = require("../repositories/vehicle.repository");
const driverRepository = require("../repositories/driver.repository");
const vendorRepository = require("../repositories/vendor.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const eventRepository = require("../repositories/event.repository");
const AppError = require("../utils/AppError");
const { STATUS, VEHICLE_STATUS, EVENT_STATUS } = require("../constants/status");
const { createLog } = require("./auditLog.service");

const normalizeVehicleNumber = (value) =>
  String(value ?? "").trim().replace(/\s+/g, "").toUpperCase();

const getId = (value) => {
  if (!value) return null;
  if (typeof value === "object" && value._id) return String(value._id);
  if (typeof value === "object" && value.id) return String(value.id);
  return String(value);
};

const assertFound = (document, message) => {
  if (!document || document.isDeleted === true) {
    throw new AppError(message, 404);
  }
  return document;
};

const logAction = async (details) => {
  try {
    if (details.user) await createLog(details);
  } catch (error) {
    console.error("Vehicle audit log failed:", error.message);
  }
};

const validateVendor = async (vendorId) => {
  if (!vendorId || !mongoose.isValidObjectId(getId(vendorId))) {
    throw new AppError("A valid vendor is required.", 400);
  }

  const vendor = assertFound(
    await vendorRepository.findById(getId(vendorId)),
    "Vendor not found."
  );

  if (vendor.status && vendor.status !== STATUS.ACTIVE) {
    throw new AppError("Selected vendor is not active.", 400);
  }

  return vendor;
};

const validateEvent = async (eventId, { allowClosed = false } = {}) => {
  if (!eventId || !mongoose.isValidObjectId(getId(eventId))) {
    throw new AppError("A valid event is required for vehicle registration.", 400);
  }

  const event = assertFound(
    await eventRepository.findById(getId(eventId)),
    "Event not found."
  );

  if (
    !allowClosed &&
    [EVENT_STATUS.CANCELLED, EVENT_STATUS.COMPLETED].includes(event.status)
  ) {
    throw new AppError(
      "Vehicles cannot be registered for a cancelled or completed event.",
      400
    );
  }

  return event;
};

const validateDriver = async (driverId, vendorId, vehicleId = null) => {
  if (!driverId) return null;

  if (!mongoose.isValidObjectId(getId(driverId))) {
    throw new AppError("Invalid driver ID.", 400);
  }

  const driver = assertFound(
    await driverRepository.findById(getId(driverId)),
    "Driver not found."
  );

  if (driver.status !== STATUS.ACTIVE) {
    throw new AppError("Selected driver is not active.", 400);
  }

  if (getId(driver.vendor) !== getId(vendorId)) {
    throw new AppError(
      "Selected driver does not belong to the selected vendor.",
      400
    );
  }

  const currentVehicleId = getId(driver.currentVehicle);

  if (currentVehicleId && currentVehicleId !== getId(vehicleId)) {
    throw new AppError(
      "Selected driver is already assigned to another vehicle.",
      409
    );
  }

  return driver;
};

const ensureNoActiveAssignments = async (vehicleId) => {
  const assignments = await vehicleAssignmentRepository.findByVehicle(vehicleId);

  if (assignments?.length) {
    throw new AppError(
      "This vehicle has an active assignment and cannot be changed or deleted.",
      409
    );
  }
};

/**
 * Create a vehicle or register an existing vehicle for an event.
 * Signature matches the controller/importer:
 * createVehicle(vehicleData, createdByUserId).
 */
const createVehicle = async (vehicleData = {}, createdBy = null) => {
  const normalizedNumber = normalizeVehicleNumber(
    vehicleData.vehicleNumber || vehicleData.registrationNumber
  );

  if (!normalizedNumber) {
    throw new AppError("Vehicle number is required.", 400);
  }

  const vendorId = vehicleData.vendor || vehicleData.vendorId;
  const eventId = vehicleData.event || vehicleData.eventId;
  const driverId = vehicleData.currentDriver || vehicleData.driverId || null;

  const vendor = await validateVendor(vendorId);
  await validateEvent(eventId);

  const existingVehicle =
    await vehicleRepository.findByVehicleNumber(normalizedNumber);

  let vehicle;

  if (existingVehicle) {
    if (getId(existingVehicle.vendor) !== getId(vendor._id)) {
      throw new AppError(
        `Vehicle ${normalizedNumber} is already registered under a different vendor.`,
        409
      );
    }

    const registeredEvents = Array.isArray(existingVehicle.eventsUsedFor)
      ? existingVehicle.eventsUsedFor
      : [];

    if (registeredEvents.some((id) => getId(id) === getId(eventId))) {
      throw new AppError(
        "This vehicle is already registered for this event.",
        409
      );
    }

    if (driverId) {
      const selectedDriver = await validateDriver(
        driverId,
        vendor._id,
        existingVehicle._id
      );

      const existingDriverId = getId(existingVehicle.currentDriver);

      if (
        existingDriverId &&
        existingDriverId !== getId(selectedDriver._id)
      ) {
        throw new AppError(
          "This vehicle is already linked to a different driver.",
          409
        );
      }

      if (!existingDriverId) {
        await vehicleRepository.updateById(existingVehicle._id, {
          currentDriver: selectedDriver._id,
          updatedBy: createdBy || undefined,
        });

        await driverRepository.updateById(selectedDriver._id, {
          currentVehicle: existingVehicle._id,
          updatedBy: createdBy || undefined,
        });
      }
    }

    vehicle = await vehicleRepository.addEventUsage(
      existingVehicle._id,
      eventId
    );

    if (!vehicle) {
      throw new AppError(
        "Could not register the existing vehicle for this event.",
        500
      );
    }

    await logAction({
      user: createdBy,
      action: "UPDATE",
      module: "VEHICLE",
      referenceId: vehicle._id,
      description: `Vehicle ${normalizedNumber} registered for event ${getId(eventId)}.`,
      metadata: {
        vehicleNumber: normalizedNumber,
        eventId: getId(eventId),
      },
    });

    return vehicle;
  }

  const selectedDriver = driverId
    ? await validateDriver(driverId, vendor._id)
    : null;

  const allowedFields = [
    "vehicleType",
    "brand",
    "model",
    "manufactureYear",
    "fuelType",
    "seatingCapacity",
    "rcExpiry",
    "insuranceExpiry",
    "permitExpiry",
    "fitnessExpiry",
    "pucExpiry",
    "gpsEnabled",
  ];

  const vehicleFields = {};

  for (const field of allowedFields) {
    if (vehicleData[field] !== undefined && vehicleData[field] !== "") {
      vehicleFields[field] = vehicleData[field];
    }
  }

  vehicle = await vehicleRepository.create({
    ...vehicleFields,
    vehicleNumber: normalizedNumber,
    vendor: vendor._id,
    currentDriver: selectedDriver?._id || null,
    eventsUsedFor: [eventId],
    status: vehicleData.status || VEHICLE_STATUS.AVAILABLE,
    isDeleted: false,
    ...(createdBy ? { createdBy } : {}),
  });

  if (selectedDriver) {
    await driverRepository.updateById(selectedDriver._id, {
      currentVehicle: vehicle._id,
      ...(createdBy ? { updatedBy: createdBy } : {}),
    });
  }

  await logAction({
    user: createdBy,
    action: "CREATE",
    module: "VEHICLE",
    referenceId: vehicle._id,
    description: `Vehicle ${normalizedNumber} created and registered for an event.`,
    metadata: {
      vehicleNumber: normalizedNumber,
      eventId: getId(eventId),
      vendorId: getId(vendor._id),
    },
  });

  return vehicle;
};

const getAllVehicles = async (filters = {}) => {
  return vehicleRepository.findAll({
    ...filters,
    isDeleted: false,
  });
};

const getVehicleById = async (vehicleId) => {
  if (!mongoose.isValidObjectId(vehicleId)) {
    throw new AppError("Invalid vehicle ID.", 400);
  }

  return assertFound(
    await vehicleRepository.findById(vehicleId),
    "Vehicle not found."
  );
};

const updateVehicle = async (
  vehicleId,
  updateData = {},
  updatedBy = null
) => {
  if (!mongoose.isValidObjectId(vehicleId)) {
    throw new AppError("Invalid vehicle ID.", 400);
  }

  const vehicle = assertFound(
    await vehicleRepository.findById(vehicleId),
    "Vehicle not found."
  );

  const changes = { ...updateData };

  delete changes._id;
  delete changes.id;
  delete changes.createdBy;
  delete changes.isDeleted;
  delete changes.eventsUsedFor;
  delete changes.event;
  delete changes.eventId;

  if (changes.vehicleNumber !== undefined) {
    changes.vehicleNumber = normalizeVehicleNumber(changes.vehicleNumber);

    if (!changes.vehicleNumber) {
      throw new AppError("Vehicle number cannot be empty.", 400);
    }

    const duplicate = await vehicleRepository.findByVehicleNumber(
      changes.vehicleNumber
    );

    if (duplicate && getId(duplicate._id) !== getId(vehicle._id)) {
      throw new AppError(
        "A vehicle with this registration number already exists.",
        409
      );
    }
  }

  const vendorId = changes.vendor || vehicle.vendor;

  const driverWasProvided = Object.prototype.hasOwnProperty.call(
    changes,
    "currentDriver"
  );

  const requestedDriverId = driverWasProvided
    ? changes.currentDriver
    : vehicle.currentDriver;

  const vendorChanged = getId(vendorId) !== getId(vehicle.vendor);

  const driverChanged =
    driverWasProvided &&
    getId(requestedDriverId) !== getId(vehicle.currentDriver);

  if (vendorChanged || driverChanged) {
    await ensureNoActiveAssignments(vehicle._id);
  }

  if (vendorChanged) {
    await validateVendor(vendorId);
  }

  const selectedDriver = requestedDriverId
    ? await validateDriver(requestedDriverId, vendorId, vehicle._id)
    : null;

  if (vendorChanged) {
    changes.vendor = vendorId;
  }

  if (driverWasProvided) {
    changes.currentDriver = selectedDriver?._id || null;
  }

  if (updatedBy) {
    changes.updatedBy = updatedBy;
  }

  const oldDriverId = getId(vehicle.currentDriver);

  const savedVehicle = await vehicleRepository.updateById(
    vehicleId,
    changes
  );

  if (!savedVehicle) {
    throw new AppError(
      "Vehicle not found or could not be updated.",
      404
    );
  }

  if (driverChanged && oldDriverId) {
    const oldDriver = await driverRepository.findById(oldDriverId);

    if (
      oldDriver &&
      getId(oldDriver.currentVehicle) === getId(vehicle._id)
    ) {
      await driverRepository.updateById(oldDriverId, {
        currentVehicle: null,
        ...(updatedBy ? { updatedBy } : {}),
      });
    }
  }

  if (driverChanged && selectedDriver) {
    await driverRepository.updateById(selectedDriver._id, {
      currentVehicle: vehicle._id,
      ...(updatedBy ? { updatedBy } : {}),
    });
  }

  await logAction({
    user: updatedBy,
    action: "UPDATE",
    module: "VEHICLE",
    referenceId: savedVehicle._id,
    description: `Vehicle ${savedVehicle.vehicleNumber} updated.`,
    metadata: { changes: updateData },
  });

  return savedVehicle;
};

const deleteVehicle = async (vehicleId, deletedBy = null) => {
  if (!mongoose.isValidObjectId(vehicleId)) {
    throw new AppError("Invalid vehicle ID.", 400);
  }

  const vehicle = assertFound(
    await vehicleRepository.findById(vehicleId),
    "Vehicle not found."
  );

  await ensureNoActiveAssignments(vehicle._id);

  if (vehicle.currentDriver) {
    const driverId = getId(vehicle.currentDriver);
    const driver = await driverRepository.findById(driverId);

    if (
      driver &&
      getId(driver.currentVehicle) === getId(vehicle._id)
    ) {
      await driverRepository.updateById(driverId, {
        currentVehicle: null,
        ...(deletedBy ? { updatedBy: deletedBy } : {}),
      });
    }
  }

  const deletedVehicle = await vehicleRepository.softDelete(vehicleId);

  if (!deletedVehicle) {
    throw new AppError(
      "Vehicle not found or already deleted.",
      404
    );
  }

  await logAction({
    user: deletedBy,
    action: "DELETE",
    module: "VEHICLE",
    referenceId: vehicleId,
    description: `Vehicle ${vehicle.vehicleNumber} deleted.`,
  });

  return deletedVehicle;
};

const updateVehicleStatus = async (
  vehicleId,
  status,
  updatedBy = null
) => {
  if (!mongoose.isValidObjectId(vehicleId)) {
    throw new AppError("Invalid vehicle ID.", 400);
  }

  if (!Object.values(VEHICLE_STATUS).includes(status)) {
    throw new AppError("Invalid vehicle status.", 400);
  }

  const vehicle = assertFound(
    await vehicleRepository.findById(vehicleId),
    "Vehicle not found."
  );

  if (
    [VEHICLE_STATUS.ASSIGNED, VEHICLE_STATUS.ON_DUTY].includes(status)
  ) {
    throw new AppError(
      "Use the vehicle assignment workflow to assign a vehicle or mark it on duty.",
      400
    );
  }

  if (status === VEHICLE_STATUS.AVAILABLE && vehicle.currentDriver) {
    throw new AppError(
      "Remove the vehicle's current driver through the vehicle update workflow before marking it available.",
      409
    );
  }

  if (
    [VEHICLE_STATUS.MAINTENANCE, VEHICLE_STATUS.INACTIVE].includes(status)
  ) {
    await ensureNoActiveAssignments(vehicleId);
  }

  const updatedVehicle = await vehicleRepository.updateStatus(
    vehicleId,
    status,
    updatedBy
  );

  if (!updatedVehicle) {
    throw new AppError(
      "Vehicle not found or could not be updated.",
      404
    );
  }

  await logAction({
    user: updatedBy,
    action: "STATUS_UPDATE",
    module: "VEHICLE",
    referenceId: updatedVehicle._id,
    description: `Vehicle status changed to ${status}.`,
  });

  return updatedVehicle;
};

const getVehiclesByEvent = async (eventId) => {
  if (!mongoose.isValidObjectId(eventId)) {
    throw new AppError("Invalid event ID.", 400);
  }

  await validateEvent(eventId, { allowClosed: true });

  return vehicleRepository.findByEvent(eventId);
};

const importVehiclesFromExcel = async (
  fileBuffer,
  eventId,
  userId
) => {
  const importer = require("./vehicleExcelImport.service");

  return importer.importVehiclesFromExcel(
    fileBuffer,
    eventId,
    userId
  );
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
