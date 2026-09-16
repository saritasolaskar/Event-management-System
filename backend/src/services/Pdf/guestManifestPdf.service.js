const eventRepository =
    require("../../repositories/event.repository");

const guestRepository =
    require("../../repositories/guest.repository");

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
 * Generate Guest Manifest PDF
 */
const generateGuestManifestPdf = async (
    eventId,
    user
) => {

    const event =
        await eventRepository.findById(
            eventId
        );

    if (!event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    /*
     * CLIENT users can only download
     * manifests for their own events.
     */
    if (
        user.role === ROLES.CLIENT &&
        (
            !user.client ||
            !event.client ||
            event.client._id.toString() !==
                user.client.toString()
        )
    ) {
        throw new AppError(
            "Unauthorized.",
            403
        );
    }

    const guests =
        await guestRepository.findByEvent(
            eventId
        );

    const guestAssignments =
        await guestAssignmentRepository.findByEvent(
            eventId
        );

    const assignmentMap =
        new Map();

    for (
        const assignment of guestAssignments
    ) {

        if (!assignment.guest) {
            continue;
        }

        assignmentMap.set(
            assignment.guest._id.toString(),
            assignment
        );
    }

    const guestList =
        guests.map(
            (guest) => {

                const assignment =
                    assignmentMap.get(
                        guest._id.toString()
                    );

                const driver =
                    assignment
                        ?.vehicleAssignment
                        ?.driver;

                const vehicle =
                    assignment
                        ?.vehicleAssignment
                        ?.vehicle;

                const driverName =
                    driver
                        ? `${driver.firstName || ""} ${
                            driver.lastName || ""
                          }`.trim()
                        : "-";

                return {

                    name:
                        `${guest.firstName} ${
                            guest.lastName || ""
                        }`.trim(),

                    company:
                        "-",

                    phone:
                        guest.phone || "-",

                    pickupLocation:
                        guest.pickupLocation || null,

                    dropLocation:
                        guest.dropLocation || null,

                    status:
                        guest.status,

                    vehicleAssignment:
                        assignment
                            ? {
                                vehicle:
                                    vehicle
                                        ? {
                                            vehicleNumber:
                                                vehicle.vehicleNumber,
                                        }
                                        : null,

                                driver:
                                    driver
                                        ? {
                                            name:
                                                driverName,
                                        }
                                        : null,
                            }
                            : null,
                };
            }
        );

    const assigned =
        guestList.filter(
            (guest) =>
                guest.vehicleAssignment
        ).length;

    const pickedUp =
        guestList.filter(
            (guest) =>
                guest.status === "PICKED_UP"
        ).length;

    const dropped =
        guestList.filter(
            (guest) =>
                guest.status === "DROPPED"
        ).length;

    const pending =
        guestList.length - assigned;

    const data = {

        company: {

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

            gst:
                config.COMPANY_GST ||
                "",
        },

        event: {

            ...(
                event.toObject
                    ? event.toObject()
                    : event
            ),

            eventName:
                event.name,

            startDateFormatted:
                event.startDate
                    ? event.startDate.toLocaleDateString()
                    : "",

            endDateFormatted:
                event.endDate
                    ? event.endDate.toLocaleDateString()
                    : "",
        },

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