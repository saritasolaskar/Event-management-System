const eventRepository =
require("../../repositories/event.repository");

const guestRepository =
require("../../repositories/guest.repository");

const guestAssignmentRepository =
require("../../repositories/guestAssignment.repository");

const pdfGenerator =
require("./pdfGenerator");

const generateGuestManifestPdf = async (
    eventId
) => {

    const event =
        await eventRepository.findById(eventId);

    if (!event) {
        throw new Error("Event not found.");
    }

    const guests =
        await guestRepository.findByEvent(eventId);

    const guestAssignments =
        await guestAssignmentRepository.findByEvent(eventId);

    const guestList =
        guests.map((guest) => {

            const assignment =
                guestAssignments.find(
                    item =>
                        item.guest._id.toString() ===
                        guest._id.toString()
                );

            return {

                name: guest.name,

                company: guest.company,

                phone: guest.phone,

                pickupAddress: guest.pickupAddress,

                dropAddress: guest.dropAddress,

                vehicleNumber:
                    assignment?.vehicleAssignment?.vehicle
                        ?.vehicleNumber || "-",

                driverName:
                    assignment?.vehicleAssignment?.driver
                        ?.name || "-",

                status:
                    guest.status,

            };

        });

    const assigned =
        guestList.filter(
            guest => guest.vehicleNumber !== "-"
        ).length;

    const pickedUp =
        guestList.filter(
            guest => guest.status === "PICKED_UP"
        ).length;

    const dropped =
        guestList.filter(
            guest => guest.status === "DROPPED"
        ).length;

    const pending =
        guestList.length - assigned;

    const data = {

        company: {

            name: "Transit Fleets",

            address: "Your Company Address",

            phone: "Your Phone",

            email: "info@transitfleets.com",

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