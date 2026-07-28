const eventRepository = require("../repositories/event.repository");
const guestRepository = require("../repositories/guest.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const clientInvoiceRepository = require("../repositories/clientInvoice.repository");
const guestAssignmentRepository = require("../repositories/guestAssignment.repository");
const driverTrackingRepository = require("../repositories/driverTracking.repository");
const AppError = require("../utils/appError");

const {
    BILL_STATUS,
    EVENT_STATUS,
} = require("../constants/status");

const {
    GUEST_ASSIGNMENT_STATUS,
} = require("../constants/status");
/**
 * Dashboard
 */
const getDashboard = async (clientId) => {

    const events =
        await eventRepository.findByClient(clientId);

    const invoices =
        await clientInvoiceRepository.findByClient(clientId);

    return {

        totalEvents: events.length,

        totalInvoices: invoices.length,

        pendingInvoices:
            invoices.filter(
                i => i.status !== BILL_STATUS.PAID
            ).length,

       completedEvents:
        events.filter(
            event =>
                event.status === EVENT_STATUS.COMPLETED
        ).length,
    };

};

/**
 * Events
 */
const getEvents = async (clientId) => {

    return eventRepository.findByClient(clientId);

};

/**
 * Event Details
 */
const getEventDetails = async (
    eventId,
    clientId
) => {

    const event =
        await eventRepository.findById(eventId);

    if (!event)
        throw new AppError(
            "Event not found.",
            404
        );

    if (
        event.client._id.toString() !==
        clientId.toString()
    ) {
        throw new AppError(
            "Unauthorized.",
            403
        );
    }

    return event;

}

/**
 * Guest List
 */
const getGuests = async (
    eventId
) => {

    return guestRepository.findByEventWithAssignment(eventId);

}

/**
 * Vehicle Assignments
 */
const getVehicles = async (
    eventId
) => {

    return vehicleAssignmentRepository
        .findByEvent(eventId);

}

/**
 * Invoices
 */
const getInvoice = async (
    invoiceId,
    clientId
) => {

    const invoice =
        await clientInvoiceRepository.findById(
            invoiceId
        );

    if (!invoice) {

        throw new AppError(
            "Invoice not found.",
            404
        );

    }

    if (
        invoice.client._id.toString() !==
        clientId.toString()
    ) {

        throw new AppError(
            "Unauthorized.",
            403
        );

    }

    return invoice;

};

const getEventOverview = async (
    eventId,
    clientId
) => {

    const event =
        await getEventDetails(
            eventId,
            clientId
        );

    const guests =
        await guestRepository.findByEvent(
            eventId
        );

    const vehicleAssignments =
        await vehicleAssignmentRepository.findByEvent(
            eventId
        );

    const guestAssignments =
        await guestAssignmentRepository.findByEvent(
            eventId
        );

    const totalGuests = guests.length;

    const assignedGuests =
        guestAssignments.length;

    const pickedUpGuests =
        guestAssignments.filter(
            assignment =>
                assignment.status ===
                GUEST_ASSIGNMENT_STATUS.PICKED_UP
        ).length;

    const droppedGuests =
        guestAssignments.filter(
            assignment =>
                assignment.status ===
                GUEST_ASSIGNMENT_STATUS.DROPPED
        ).length;

    const pendingGuests =
        totalGuests - pickedUpGuests;

    return {

        event,

        guests,

        vehicleAssignments,

        guestAssignments,

        statistics: {

            totalGuests,

            assignedGuests,

            pickedUpGuests,

            droppedGuests,

            pendingGuests,

        },

    };

};





const getLiveTracking = async (
    eventId
) => {

    const assignments =
        await vehicleAssignmentRepository.findByEvent(
            eventId
        );

    const tracking = [];

    for (const assignment of assignments) {

        const latest =
            await driverTrackingRepository
                .findLatestByDuty(
                    assignment.duty
                );

        if (latest) {

            tracking.push({

                driver:
                    assignment.driver,

                vehicle:
                    assignment.vehicle,

                location: latest,

            });

        }

    }

    return tracking;

};




const getDrivers = async (
    eventId
) => {

    const assignments =
        await vehicleAssignmentRepository.findByEvent(
            eventId
        );

    return assignments.map(
        assignment => ({

            driver:
                assignment.driver,

            vehicle:
                assignment.vehicle,

            vendor:
                assignment.vendor,

        })
    );

};

module.exports = {
    getDashboard,
    getEvents,
    getEventDetails,
    getGuests,
    getVehicles,
    getInvoices,
    getEventOverview,
    getDrivers,
    getLiveTracking,
    getInvoice,
};