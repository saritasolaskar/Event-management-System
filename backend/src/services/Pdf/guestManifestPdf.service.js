const eventRepository = require("../../repositories/event.repository");
const guestRepository = require("../../repositories/guest.repository");
const guestAssignmentRepository = require("../../repositories/guestAssignment.repository");

const pdfGenerator = require("../pdfGenerator");

const config = require("../../config/env");
const AppError = require("../../utils/appError");

/**
 * Generate Guest Manifest PDF
 */
const generateGuestManifestPdf = async (eventId) => {

    const event =
        await eventRepository.findById(eventId);

    if (!event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    const guests =
        await guestRepository.findByEvent(eventId);

    const guestAssignments =
        await guestAssignmentRepository.findByEvent(
            eventId
        );

    const guestList = guests.map((guest) => {

        const assignment =
            guestAssignments.find(
                (item) =>
                    item.guest &&
                    item.guest._id.toString() ===
                    guest._id.toString()
            );

        return {

            name:
                guest.name,

            company:
                guest.company,

            phone:
                guest.phone,

            pickupAddress:
                guest.pickupAddress,

            dropAddress:
                guest.dropAddress,

            vehicleNumber:
                assignment?.vehicleAssignment?.vehicle
                    ?.registrationNumber || "-",

            driverName:
                assignment?.vehicleAssignment?.driver
                    ? `${assignment.vehicleAssignment.driver.firstName} ${assignment.vehicleAssignment.driver.lastName}`
                    : "-",

            status:
                guest.status,

        };

    });

    const assigned =
        guestList.filter(
            (guest) => guest.vehicleNumber !== "-"
        ).length;

    const pickedUp =
        guestList.filter(
            (guest) => guest.status === "PICKED_UP"
        ).length;

    const dropped =
        guestList.filter(
            (guest) => guest.status === "DROPPED"
        ).length;

    const pending =
        guestList.length - assigned;

    const data = {

        company: {

            name:
                config.COMPANY_NAME || "Transit Fleets",

            address:
                config.COMPANY_ADDRESS || "",

            phone:
                config.COMPANY_PHONE || "",

            email:
                config.COMPANY_EMAIL || "",

            gst:
                config.COMPANY_GST || "",

        },

        event,

        client:
            event.client,

        guests:
            guestList,

        summary: {

            totalGuests:
                guestList.length,

            assigned,

            pending,

            pickedUp,

            dropped,

        },

        generatedAt:
            new Date().toLocaleString(),

    };

    return pdfGenerator.generatePdf(
        "guestManifest",
        data
    );

};

module.exports = {
    generateGuestManifestPdf,
};