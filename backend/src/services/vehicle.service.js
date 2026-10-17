
const normalizeExcelHeader = (header) =>
    String(header || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const firstExcelValue = (row, aliases) => {
    for (const alias of aliases) {
        const value = row[alias];

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

const normalizeExcelRow = (rawRow) => {
    const normalized = {};

    for (const [header, value] of Object.entries(rawRow || {})) {
        normalized[normalizeExcelHeader(header)] = value;
    }

    return normalized;
};

const importVehiclesFromExcel = async (
    fileBuffer,
    eventId,
    userId
) => {
    if (!fileBuffer) {
        throw new AppError("Excel file is required.", 400);
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
    });

    if (!rows.length) {
        throw new AppError(
            "Excel file does not contain any vehicle rows.",
            400
        );
    }

    const event = await validateEventForVehicle(eventId);
    const imported = [];
    const skipped = [];
    const failed = [];

    for (let index = 0; index < rows.length; index++) {
        const row = normalizeExcelRow(rows[index]);
        const rowNumber = index + 2;

        const vehicleNumber = String(
            firstExcelValue(row, [
                "vehiclenumber",
                "vehicleno",
                "registrationnumber",
                "registrationno",
                "vehicleregistration",
                "numberplate",
            ])
        ).trim().toUpperCase();

        try {
            const vehicleType = String(
                firstExcelValue(row, [
                    "vehicletype",
                    "type",
                    "category",
                ])
            ).trim().toUpperCase();

            const vendorName = String(
                firstExcelValue(row, [
                    "vendor",
                    "vendorname",
                    "companyname",
                    "vendorcompany",
                ])
            ).trim();

            const seatingCapacity = Number(
                firstExcelValue(row, [
                    "seatingcapacity",
                    "capacity",
                    "seats",
                    "numberofseats",
                ]) || 0
            );

            const driverPhone = String(
                firstExcelValue(row, [
                    "driverphone",
                    "drivermobile",
                    "drivercontact",
                    "drivercontactnumber",
                    "phone",
                    "mobile",
                    "contactnumber",
                ])
            ).trim();

            if (!vehicleNumber) {
                throw new Error(
                    "Vehicle Number is required. Check the column heading."
                );
            }

            if (!vehicleType) {
                throw new Error(
                    "Vehicle Type is required. Check the column heading."
                );
            }

            if (!vendorName) {
                throw new Error(
                    "Vendor is required. Enter the vendor company name."
                );
            }

            if (
                !Number.isFinite(seatingCapacity) ||
                seatingCapacity <= 0
            ) {
                throw new Error(
                    "Seating Capacity must be a positive number."
                );
            }

            const vendor =
                await vendorRepository.findByCompanyName(vendorName);

            if (!vendor || vendor.isDeleted) {
                throw new Error(
                    `Vendor "${vendorName}" not found or unavailable. Create the vendor first or check the company name.`
                );
            }

            let driverId = null;

            // Driver Phone is optional.
            if (driverPhone) {
                const driver =
                    await driverRepository.findByPhone(driverPhone);

                if (!driver || driver.isDeleted) {
                    throw new Error(
                        `Driver with phone ${driverPhone} not found. Check the number or leave the driver column blank.`
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
                    existingVehicle.eventsUsedFor?.some(
                        (id) => getId(id) === getId(event._id)
                    );

                if (alreadyRegistered) {
                    skipped.push({
                        row: rowNumber,
                        vehicleNumber,
                        reason: "Already registered for this event.",
                    });

                    continue;
                }

                if (
                    getId(existingVehicle.vendor) !== getId(vendor._id)
                ) {
                    throw new Error(
                        `Vehicle ${vehicleNumber} is already registered under a different vendor. It was not added to this event.`
                    );
                }

                if (
                    driverId &&
                    getId(existingVehicle.currentDriver) !== getId(driverId)
                ) {
                    throw new Error(
                        `Vehicle ${vehicleNumber} is not linked to the driver with phone ${driverPhone}. Update the vehicle's driver first.`
                    );
                }

                await vehicleRepository.addEventUsage(
                    existingVehicle._id,
                    event._id
                );

                imported.push({
                    row: rowNumber,
                    vehicleNumber,
                    action: "REUSED",
                });

                continue;
            }

            const optionalValue = (aliases) => {
                const value = firstExcelValue(row, aliases);
                return value === "" ? undefined : value;
            };

            await createVehicle(
                {
                    vehicleNumber,
                    vehicleType,
                    seatingCapacity,
                    vendor: vendor._id,
                    currentDriver: driverId,
                    brand: optionalValue(["brand", "make"]),
                    model: optionalValue(["model"]),
                    manufactureYear: optionalValue([
                        "manufactureyear",
                        "year",
                        "modelyear",
                    ]),
                    fuelType: optionalValue(["fueltype", "fuel"]),
                    event: eventId,
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
                    error.message ||
                    "Unable to import vehicle.",
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
