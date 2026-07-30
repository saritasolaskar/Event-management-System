const dutyRepository = require("../../repositories/duty.repository");
const guestAssignmentRepository = require("../../repositories/guestAssignment.repository");

const pdfGenerator = require("./pdfGenerator");

const config = require("../../config/env");
const AppError = require("../../utils/appError");

/**
 * Generate Duty Sheet PDF
 */
const generateDutySheetPdf = async (dutyId) => {

    const duty =
        await dutyRepository.findById(dutyId);

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

    const guestAssignments =
        await guestAssignmentRepository.findByVehicleAssignment(
            vehicleAssignment._id
        );

    const guests = guestAssignments.map((item) => ({
        name: item.guest?.name || "-",
        phone: item.guest?.phone || "-",
        pickupAddress: item.guest?.pickupAddress || "-",
        dropAddress: item.guest?.dropAddress || "-",
    }));

    const company = {

        name:
            config.COMPANY_NAME || "Transit Fleets",

        address:
            config.COMPANY_ADDRESS || "",

        phone:
            config.COMPANY_PHONE || "",

        email:
            config.COMPANY_EMAIL || "",

        emergency:
            config.EMERGENCY_CONTACT || "",

    };

    const data = {

        company,

        duty,

        event:
            duty.event,

        client:
            duty.event?.client || null,

        vendor:
            vehicleAssignment.vendor,

        vehicle:
            vehicleAssignment.vehicle,

        driver:
            vehicleAssignment.driver,

        guests,

        contacts: {

            operations:
                "Operations Team",

            clientSpoc:
                duty.event?.client?.companyName || "-",

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