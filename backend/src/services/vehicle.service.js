
const mongoose = require("mongoose");

const vehicleRepository = require("../repositories/vehicle.repository");
const driverRepository = require("../repositories/driver.repository");
const vendorRepository = require("../repositories/vendor.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const eventRepository = require("../repositories/event.repository");
const AppError = require("../utils/AppError");
const { VEHICLE_STATUS, EVENT_STATUS } = require("../constants/status");
const { createLog } = require("./auditLog.service");
const { createNotification } = require("./notification.service");

const normalizeVehicleNumber = (value) =>
  String(value || "").trim().toUpperCase().replace(/\s+/g, " ");

const getId = (value) => {
  if (!value) return null;
  return String(value._id || value.id || value);
};

const isDeleted = (document) =>
  !document || document.isDeleted === true;

const assertExists = (document, message) => {
  if (!document || document.isDeleted === true) {
    throw new AppError(message, 404);
  }
  return document;
};

const runInTransaction = async (callback) => {
  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      result = await callback(session);
    });

    return result;
  } finally {
    await session.endSession();
  }
};

const logAction = async (details) => {
  try {
    await createLog(details);
  } catch (error) {
    console.error("Vehicle audit log failed:", error.message);
  }
};

const notify = async (details) => {
  try {
    await createNotification(details);
  } catch (error) {
    console.error("Vehicle notification failed:", error.message);
  }
};

const getVehicleByNumber = async (vehicleNumber, session = null) => {
  const normalizedNumber = normalizeVehicleNumber(vehicleNumber);

  if (!normalizedNumber) return null;

  return vehicleRepository.findByVehicleNumber(
    normalizedNumber,
    session
  );
};

const validateVendor = async (vendorId, session = null) => {
  if (!vendorId) {
    throw new AppError("Vendor is required for vehicle registration.", 400);
  }

  const vendor = await vendorRepository.findById(vendorId, session);

  assertExists(vendor, "Vendor not found.");

  if (vendor.status && vendor.status !== "ACTIVE") {
    throw new AppError("Selected vendor is not active.", 400);
  }

  return vendor;
};

const validateEvent = async (eventId, session = null) => {
  if (!eventId) {
    throw new AppError("Event is required for vehicle registration.", 400);
  }

  const event = await eventRepository.findById(eventId, session);

  assertExists(event, "Event not found.");

  if (
    event.status &&
    [
      EVENT_STATUS.CANCELLED,
      EVENT_STATUS.COMPLETED,
    ].includes(event.status)
  ) {
    throw new AppError(
      "Vehicles cannot be registered for a cancelled or completed event.",
      400
    );
  }

  return event;
};

const validateDriver = async ({
  driverId,
  vendorId,
  vehicleId = null,
  session = null,
}) => {
  if (!driverId) return null;

  const driver = await driverRepository.findById(driverId, session);

  assertExists(driver, "Driver not found.");

  if (driver.status && driver.status !== "ACTIVE") {
    throw new AppError("Selected driver is not active.", 400);
  }

  if (
    driver.vendor &&
    getId(driver.vendor) !== getId(vendorId)
  ) {
    throw new AppError(
      "Selected driver does not belong to the selected vendor.",
      400
    );
  }

  if (
    driver.currentVehicle &&
    getId(driver.currentVehicle) !== getId(vehicleId)
  ) {
    throw new AppError(
      "Selected driver is already assigned to another vehicle.",
      409
    );
  }

  return driver;
};

const validateNoActiveAssignment = async (
  vehicleId,
  session = null
) => {
  const assignments = await vehicleAssignmentRepository.findByVehicle(
    vehicleId,
    session
  );

  if (assignments && assignments.length > 0) {
    throw new AppError(
      "This vehicle has an active assignment and cannot be changed or deleted.",
      409
    );
  }
};

const createVehicle = async (vehicleData, options = {}) => {
  const {
    vehicleNumber,
    registrationNumber,
    vendor,
    vendorId,
    event,
    eventId,
    driver,
    driverId,
    createdBy,
    ...otherData
  } = vehicleData || {};

  const normalizedNumber = normalizeVehicleNumber(
    vehicleNumber || registrationNumber
  );

  if (!normalizedNumber) {
    throw new AppError("Vehicle registration number is required.", 400);
  }

  const selectedVendorId = vendorId || vendor;
  const selectedEventId = eventId || event;
  const selectedDriverId = driverId || driver;

  const result = await runInTransaction(async (session) => {
    const selectedVendor = await validateVendor(
      selectedVendorId,
      session
    );

    await validateEvent(selectedEventId, session);

    const existingVehicle = await getVehicleByNumber(
      normalizedNumber,
      session
    );

    let vehicle = existingVehicle;

    if (vehicle) {
      assertExists(vehicle, "Vehicle not found.");

      if (getId(vehicle.vendor) !== getId(selectedVendor._id)) {
        throw new AppError(
          "This vehicle registration number is already registered under another vendor.",
          409
        );
      }

      const existingEvents = (vehicle.events || []).map(getId);

      if (existingEvents.includes(getId(selectedEventId))) {
        throw new AppError(
          "This vehicle is already registered for this event.",
          409
        );
      }

      vehicle = await vehicleRepository.addEventUsage(
        vehicle._id,
        selectedEventId,
        session
      );
    } else {
      vehicle = await vehicleRepository.create(
        {
          ...otherData,
          vehicleNumber: normalizedNumber,
          registrationNumber: normalizedNumber,
          vendor: selectedVendor._id,
          driver: selectedDriverId || undefined,
          events: [selectedEventId],
          status: vehicleData.status || VEHICLE_STATUS.AVAILABLE,
          isDeleted: false,
          createdBy: createdBy || undefined,
        },
        session
      );
    }

    if (selectedDriverId) {
      const selectedDriver = await validateDriver({
        driverId: selectedDriverId,
        vendorId: selectedVendor._id,
        vehicleId: vehicle._id,
        session,
      });

      if (selectedDriver) {
        selectedDriver.currentVehicle = vehicle._id;
        await selectedDriver.save({ session });
      }
    }

    return vehicle;
  });

  await logAction({
    user: createdBy,
    action: "CREATE",
    module: "VEHICLE",
    referenceId: result._id,
    description: `Vehicle ${normalizedNumber} registered.`,
    metadata: {
      vehicleNumber: normalizedNumber,
      eventId: getId(selectedEventId),
      vendorId: getId(selectedVendorId),
    },
  });

  return result;
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

  const vehicle = await vehicleRepository.findById(vehicleId);

  return assertExists(vehicle, "Vehicle not found.");
};

const updateVehicle = async (vehicleId, updateData, updatedBy) => {
  if (!mongoose.isValidObjectId(vehicleId)) {
    throw new AppError("Invalid vehicle ID.", 400);
  }

  const updatedVehicle = await runInTransaction(async (session) => {
    const vehicle = await vehicleRepository.findById(
      vehicleId,
      session
    );

    assertExists(vehicle, "Vehicle not found.");

    const changes = { ...(updateData || {}) };

    delete changes._id;
    delete changes.id;
    delete changes.createdBy;
    delete changes.isDeleted;

    const requestedNumber =
      changes.vehicleNumber || changes.registrationNumber;

    if (requestedNumber) {
      const normalizedNumber = normalizeVehicleNumber(requestedNumber);
      const existing = await getVehicleByNumber(
        normalizedNumber,
        session
      );

      if (existing && getId(existing) !== getId(vehicle)) {
        throw new AppError(
          "A vehicle with this registration number already exists.",
          409
        );
      }

      changes.vehicleNumber = normalizedNumber;
      changes.registrationNumber = normalizedNumber;
    }

    const newVendorId = changes.vendorId || changes.vendor;
    const newDriverId = changes.driverId || changes.driver;

    const vendorChanged =
      newVendorId &&
      getId(newVendorId) !== getId(vehicle.vendor);

    const driverChanged =
      newDriverId !== undefined &&
      getId(newDriverId) !== getId(vehicle.driver);

    if (vendorChanged || driverChanged) {
      await validateNoActiveAssignment(vehicle._id, session);
    }

    if (newVendorId) {
      await validateVendor(newVendorId, session);
      changes.vendor = newVendorId;
      delete changes.vendorId;
    }

    if (newDriverId) {
      const effectiveVendorId = newVendorId || vehicle.vendor;

      await validateDriver({
        driverId: newDriverId,
        vendorId: effectiveVendorId,
        vehicleId: vehicle._id,
        session,
      });

      changes.driver = newDriverId;
      delete changes.driverId;
    }

    const oldDriverId = getId(vehicle.driver);

    const savedVehicle = await vehicleRepository.update(
      vehicleId,
      changes,
      session
    );

    if (driverChanged && oldDriverId) {
      const oldDriver = await driverRepository.findById(
        oldDriverId,
        session
      );

      if (
        oldDriver &&
        getId(oldDriver.currentVehicle) === getId(vehicle._id)
      ) {
        oldDriver.currentVehicle = null;
        await oldDriver.save({ session });
      }
    }

    if (driverChanged && newDriverId) {
      const newDriver = await driverRepository.findById(
        newDriverId,
        session
      );

      if (newDriver) {
        newDriver.currentVehicle = vehicle._id;
        await newDriver.save({ session });
      }
    }

    return savedVehicle;
  });

  await logAction({
    user: updatedBy,
    action: "UPDATE",
    module: "VEHICLE",
    referenceId: updatedVehicle._id,
    description: `Vehicle ${updatedVehicle.vehicleNumber} updated.`,
    metadata: { changes: updateData },
  });

  return updatedVehicle;
};

const deleteVehicle = async (vehicleId, deletedBy) => {
  if (!mongoose.isValidObjectId(vehicleId)) {
    throw new AppError("Invalid vehicle ID.", 400);
  }

  const deletedVehicle = await runInTransaction(async (session) => {
    const vehicle = await vehicleRepository.findById(
      vehicleId,
      session
    );

    assertExists(vehicle, "Vehicle not found.");

    await validateNoActiveAssignment(vehicle._id, session);

    if (vehicle.driver) {
      const driver = await driverRepository.findById(
        getId(vehicle.driver),
        session
      );

      if (
        driver &&
        getId(driver.currentVehicle) === getId(vehicle._id)
      ) {
        driver.currentVehicle = null;
        await driver.save({ session });
      }
    }

    return vehicleRepository.softDelete(vehicleId, session);
  });

  await logAction({
    user: deletedBy,
    action: "DELETE",
    module: "VEHICLE",
    referenceId: vehicleId,
    description: `Vehicle ${deletedVehicle.vehicleNumber} deleted.`,
  });

  return deletedVehicle;
};

const updateVehicleStatus = async (
  vehicleId,
  status,
  updatedBy
) => {
  if (!mongoose.isValidObjectId(vehicleId)) {
    throw new AppError("Invalid vehicle ID.", 400);
  }

  const allowedStatuses = Object.values(VEHICLE_STATUS);

  if (!allowedStatuses.includes(status)) {
    throw new AppError("Invalid vehicle status.", 400);
  }

  const updatedVehicle = await runInTransaction(async (session) => {
    const vehicle = await vehicleRepository.findById(
      vehicleId,
      session
    );

    assertExists(vehicle, "Vehicle not found.");

    if (
      [VEHICLE_STATUS.ASSIGNED, VEHICLE_STATUS.ON_DUTY].includes(
        status
      )
    ) {
      throw new AppError(
        "Use the vehicle assignment workflow to assign a vehicle or mark it on duty.",
        400
      );
    }

    return vehicleRepository.update(
      vehicleId,
      { status },
      session
    );
  });

  await logAction({
    user: updatedBy,
    action: "STATUS_UPDATE",
    module: "VEHICLE",
    referenceId: updatedVehicle._id,
    description: `Vehicle status changed to ${status}.`,
  });

  return updatedVehicle;
};

const getVehiclesByEvent = async (eventId, filters = {}) => {
  if (!mongoose.isValidObjectId(eventId)) {
    throw new AppError("Invalid event ID.", 400);
  }

  await validateEvent(eventId);

  return vehicleRepository.findByEvent(eventId, {
    ...filters,
    isDeleted: false,
  });
};

const importVehiclesFromExcel = async (
  file,
  eventId,
  importedBy
) => {
  const excelImportService = require("./vehicleExcelImport.service");

  if (
    typeof excelImportService.importVehiclesFromExcel !== "function"
  ) {
    throw new AppError(
      "Vehicle Excel import service is not configured correctly.",
      500
    );
  }

  return excelImportService.importVehiclesFromExcel(
    file,
    eventId,
    importedBy
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
