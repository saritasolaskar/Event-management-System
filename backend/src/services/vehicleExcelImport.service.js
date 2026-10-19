
const XLSX = require("xlsx");

const vehicleRepository = require("../repositories/vehicle.repository");
const driverRepository = require("../repositories/driver.repository");
const vendorRepository = require("../repositories/vendor.repository");
const eventRepository = require("../repositories/event.repository");
const vehicleService = require("./vehicle.service");
const AppError = require("../utils/AppError");

const { EVENT_STATUS } = require("../constants/status");

const normalizeHeader = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const normalizeVehicleNumber = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "object" && value._id) {
    return String(value._id);
  }

  return String(value);
};

const normalizeRow = (row) => {
  const result = {};

  for (const [header, value] of Object.entries(row || {})) {
    result[normalizeHeader(header)] = value;
  }

  return result;
};

const getValue = (row, aliases) => {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)];

    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

const normalizeVehicleType = (value) => {
  const type = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  const aliases = {
    CAR: "SEDAN",
    HATCH: "HATCHBACK",
    HATCHBACK: "HATCHBACK",
    SEDAN: "SEDAN",
    SUV: "SUV",
    MUV: "MUV",
    MPV: "MUV",
    TEMPO: "TEMPO_TRAVELLER",
    TEMPO_TRAVELLER: "TEMPO_TRAVELLER",
    TEMPO_TRAVELER: "TEMPO_TRAVELLER",
    MINIBUS: "MINI_BUS",
    MINI_BUS: "MINI_BUS",
    BUS: "BUS",
  };

  return aliases[type] || type;
};

const normalizeFuelType = (value) => {
  const fuel = String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");

  if (!fuel) return undefined;

  const aliases = {
    PETROL: "PETROL",
    DIESEL: "DIESEL",
    CNG: "CNG",
    ELECTRIC: "ELECTRIC",
    EV: "ELECTRIC",
    HYBRID: "HYBRID",
  };

  return aliases[fuel] || fuel;
};

const toOptionalString = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return undefined;
  }

  return String(value).trim();
};

const toOptionalYear = (value) => {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    return undefined;
  }

  const year = Number(value);

  if (!Number.isInteger(year) || year < 1980 || year > 2100) {
    throw new Error(
      `Invalid manufacture year "${value}". Enter a year between 1980 and 2100.`
    );
  }

  return year;
};

const importVehiclesFromExcel = async (
  fileBuffer,
  eventId,
  userId
) => {
  if (!fileBuffer) {
    throw new AppError("Excel file is required.", 400);
  }

  if (!eventId) {
    throw new AppError("Event ID is required.", 400);
  }

  const workbook = XLSX.read(fileBuffer, {
    type: "buffer",
    cellDates: true,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new AppError(
      "Excel file does not contain a worksheet.",
      400
    );
  }

  const worksheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    defval: "",
    raw: false,
    blankrows: false,
  });

  if (!rows.length) {
    throw new AppError(
      "Excel file does not contain any vehicle rows.",
      400
    );
  }

  const event = await eventRepository.findById(eventId);

  if (!event) {
    throw new AppError("Event not found.", 404);
  }

  if (
    event.status === EVENT_STATUS.CANCELLED ||
    event.status === EVENT_STATUS.COMPLETED
  ) {
    throw new AppError(
      "Vehicles cannot be imported into a completed or cancelled event.",
      400
    );
  }

  const allowedVehicleTypes = new Set([
    "HATCHBACK",
    "SEDAN",
    "SUV",
    "MUV",
    "TEMPO_TRAVELLER",
    "MINI_BUS",
    "BUS",
  ]);

  const allowedFuelTypes = new Set([
    "PETROL",
    "DIESEL",
    "CNG",
    "ELECTRIC",
    "HYBRID",
  ]);

  const imported = [];
  const skipped = [];
  const failed = [];

  for (let index = 0; index < rows.length; index += 1) {
    const rowNumber = index + 2;
    const row = normalizeRow(rows[index]);

    const vehicleNumber = normalizeVehicleNumber(
      getValue(row, [
        "vehicle number",
        "vehicle no",
        "vehicle num",
        "registration number",
        "registration no",
        "vehicle registration",
        "vehicle registration number",
        "number plate",
        "registration",
        "plate",
        "reg no",
        "reg number",
        "regn number",
      ])
    );

    try {
      if (!vehicleNumber) {
        throw new Error(
          "Vehicle number is missing. Check the column heading and this row."
        );
      }

      const vehicleType = normalizeVehicleType(
        getValue(row, [
          "vehicle type",
          "type",
          "category",
          "vehicle category",
          "vehicle class",
        ])
      );

      if (!allowedVehicleTypes.has(vehicleType)) {
        throw new Error(
          `Invalid vehicle type "${vehicleType || "(blank)"}". Use HATCHBACK, SEDAN, SUV, MUV, TEMPO_TRAVELLER, MINI_BUS, or BUS.`
        );
      }

      const vendorName = String(
        getValue(row, [
          "vendor",
          "vendor name",
          "company name",
          "vendor company",
          "vendor company name",
          "transport vendor",
        ])
      ).trim();

      if (!vendorName) {
        throw new Error(
          "Vendor is required. Enter the registered vendor company name."
        );
      }

      const seatingValue = getValue(row, [
        "seating capacity",
        "seating capacity including driver",
        "capacity",
        "seats",
        "number of seats",
        "seating",
      ]);

      const seatingCapacity = Number(seatingValue);

      if (
        seatingValue === "" ||
        !Number.isFinite(seatingCapacity) ||
        seatingCapacity <= 0
      ) {
        throw new Error(
          "Seating Capacity must be a positive number."
        );
      }

      const vendor = await vendorRepository.findByCompanyName(
        vendorName
      );

      if (!vendor || vendor.isDeleted) {
        throw new Error(
          `Vendor "${vendorName}" was not found or is unavailable. Check the name or register the vendor first.`
        );
      }

      const driverPhone = String(
        getValue(row, [
          "driver phone",
          "driver mobile",
          "driver contact",
          "driver contact number",
          "driver phone number",
          "phone",
          "mobile",
          "contact number",
        ])
      ).trim();

      let driverId = null;

      if (driverPhone) {
        const driver = await driverRepository.findByPhone(
          driverPhone
        );

        if (!driver || driver.isDeleted) {
          throw new Error(
            `Driver with phone ${driverPhone} was not found. Leave the driver column blank if the driver is not registered yet.`
          );
        }

        if (driver.status !== "ACTIVE") {
          throw new Error(
            `Driver with phone ${driverPhone} is not active.`
          );
        }

        if (getId(driver.vendor) !== getId(vendor._id)) {
          throw new Error(
            `Driver with phone ${driverPhone} does not belong to vendor "${vendorName}".`
          );
        }

        driverId = driver._id;
      }

      const existingVehicle =
        await vehicleRepository.findByVehicleNumber(
          vehicleNumber
        );

      if (existingVehicle) {
        const alreadyRegistered =
          Array.isArray(existingVehicle.eventsUsedFor) &&
          existingVehicle.eventsUsedFor.some(
            (registeredEventId) =>
              getId(registeredEventId) === getId(event._id)
          );

        if (alreadyRegistered) {
          skipped.push({
            row: rowNumber,
            vehicleNumber,
            reason: "Vehicle is already registered for this event.",
          });

          continue;
        }

        if (getId(existingVehicle.vendor) !== getId(vendor._id)) {
          throw new Error(
            `Vehicle ${vehicleNumber} already belongs to a different vendor.`
          );
        }

        const fuelType = normalizeFuelType(
          getValue(row, [
            "fuel type",
            "fuel",
            "fuel source",
            "type of fuel",
            "typeofuel",
          ])
        );

        if (fuelType && !allowedFuelTypes.has(fuelType)) {
          throw new Error(
            `Invalid fuel type "${fuelType}". Use PETROL, DIESEL, CNG, ELECTRIC, or HYBRID.`
          );
        }

        const manufactureYear = toOptionalYear(
          getValue(row, [
            "manufacture year",
            "manufacturing year",
            "year",
            "model year",
          ])
        );

        const brand = toOptionalString(
          getValue(row, ["brand", "make"])
        );

        const model = toOptionalString(
          getValue(row, ["model", "vehicle model"])
        );

        // Use the central service so existing-vehicle registration
        // also performs driver assignment and vehicle-status sync.
        await vehicleService.createVehicle(
          {
            vehicleNumber,
            vehicleType,
            seatingCapacity,
            vendor: vendor._id,
            event: eventId,
            ...(driverId ? { currentDriver: driverId } : {}),
            ...(brand ? { brand } : {}),
            ...(model ? { model } : {}),
            ...(manufactureYear !== undefined
              ? { manufactureYear }
              : {}),
            ...(fuelType ? { fuelType } : {}),
          },
          userId
        );

        imported.push({
          row: rowNumber,
          vehicleNumber,
          action: "REUSED",
        });

        continue;
      }

      const fuelType = normalizeFuelType(
        getValue(row, [
          "fuel type",
          "fuel",
          "fuel source",
          "type of fuel",
          "typeofuel",
        ])
      );

      if (fuelType && !allowedFuelTypes.has(fuelType)) {
        throw new Error(
          `Invalid fuel type "${fuelType}". Use PETROL, DIESEL, CNG, ELECTRIC, or HYBRID.`
        );
      }

      const manufactureYear = toOptionalYear(
        getValue(row, [
          "manufacture year",
          "manufacturing year",
          "year",
          "model year",
        ])
      );

      const brand = toOptionalString(
        getValue(row, ["brand", "make"])
      );

      const model = toOptionalString(
        getValue(row, ["model", "vehicle model"])
      );

      await vehicleService.createVehicle(
        {
          vehicleNumber,
          vehicleType,
          seatingCapacity,
          vendor: vendor._id,
          event: eventId,
          ...(driverId ? { currentDriver: driverId } : {}),
          ...(brand ? { brand } : {}),
          ...(model ? { model } : {}),
          ...(manufactureYear !== undefined
            ? { manufactureYear }
            : {}),
          ...(fuelType ? { fuelType } : {}),
        },
        userId
      );

      imported.push({
        row: rowNumber,
        vehicleNumber,
        action: "CREATED",
      });
    } catch (error) {
      failed.push({
        row: rowNumber,
        vehicleNumber,
        reason:
          error?.message || "Unable to import vehicle.",
      });
    }
  }

  return {
    event: {
      _id: event._id,
      eventCode: event.eventCode,
      name: event.name,
    },
    totalRows: rows.length,
    importedCount: imported.length,
    skippedCount: skipped.length,
    failedCount: failed.length,
    imported,
    skipped,
    failed,
  };
};

module.exports = {
  importVehiclesFromExcel,
};
