const dutyRepository =
    require("../../repositories/duty.repository");

const guestAssignmentRepository =
    require("../../repositories/guestAssignment.repository");

const pdfGenerator =
    require("../pdfGenerator");

const config =
    require("../../config/env");

const AppError =
    require("../../utils/AppError");

const {
    ROLES,
} = require("../../constants/roles");

/**
 * Generate Duty Sheet PDF
 */
const generateDutySheetPdf = async (
    dutyId,
    user
) => {

    const duty =
        await dutyRepository.findById(
            dutyId
        );

    if (!duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    if (!duty.vehicleAssignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    if (!duty.event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    const vehicleAssignment =
        duty.vehicleAssignment;

    if (!vehicleAssignment.driver) {
        throw new AppError(
            "Driver not found.",
            404
        );
    }

    if (!vehicleAssignment.vehicle) {
        throw new AppError(
            "Vehicle not found.",
            404
        );
    }

    if (!vehicleAssignment.vendor) {
        throw new AppError(
            "Vendor not found.",
            404
        );
    }

    /*
     * DRIVER users can only download
     * their own duty sheet.
     */
    if (
        user.role === ROLES.DRIVER &&
        (
            !user.driver ||
            vehicleAssignment.driver._id.toString() !==
                user.driver.toString()
        )
    ) {
        throw new AppError(
            "Unauthorized.",
            403
        );
    }

    const guestAssignments =
        await guestAssignmentRepository.findByVehicleAssignment(
            vehicleAssignment._id
        );

    const guests =
        guestAssignments.map(
            (item) => {

                const guest =
                    item.guest;

                return {
                    name:
                        guest
                            ? `${guest.firstName} ${guest.lastName || ""}`.trim()
                            : "-",

                    phone:
                        guest?.phone ||
                        "-",

                    pickupAddress:
                        guest?.pickupLocation?.name ||
                        "-",

                    dropAddress:
                        guest?.dropLocation?.name ||
                        "-",
                };
            }
        );

    const company = {

        name:
            config.COMPANY_NAME ||
            "Transit Fleets",

        address:
            config.COMPANY_ADDRESS ||
            "",

        phone:
            config.COMPANY_PHONE ||
            "",

        email:
            config.COMPANY_EMAIL ||
            "",

        emergency:
            config.EMERGENCY_CONTACT ||
            "",
    };

    const driverName =
        `${vehicleAssignment.driver.firstName || ""} ${
            vehicleAssignment.driver.lastName || ""
        }`.trim();

    const vendorName =
        vehicleAssignment.vendor.companyName ||
        "-";

    const data = {

        company,

        duty,

        event: {

            ...(
                duty.event.toObject
                    ? duty.event.toObject()
                    : duty.event
            ),

            eventName:
                duty.event.name,

            startDate:
                duty.event.startDate
                    ? duty.event.startDate.toLocaleDateString()
                    : "",

            endDate:
                duty.event.endDate
                    ? duty.event.endDate.toLocaleDateString()
                    : "",
        },

        client:
            duty.event.client || null,

        vendor: {

            ...(
                vehicleAssignment.vendor.toObject
                    ? vehicleAssignment.vendor.toObject()
                    : vehicleAssignment.vendor
            ),

            vendorName:
                vendorName,
        },

        vehicle:
            vehicleAssignment.vehicle,

        driver: {

            ...(
                vehicleAssignment.driver.toObject
                    ? vehicleAssignment.driver.toObject()
                    : vehicleAssignment.driver
            ),

            name:
                driverName,
        },

        guests,

        contacts: {

            operations:
                "Operations Team",

            clientSpoc:
                duty.event.client?.companyName ||
                "-",

            emergency:
                company.emergency,
        },

        generatedAt:
            new Date().toLocaleString(),
    };

    return pdfGenerator.generatePdf(
        "dutySheet",
        data
    );
};

module.exports = {
    generateDutySheetPdf,
};