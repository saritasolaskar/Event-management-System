const eventRepository = require("../repositories/event.repository");
const guestRepository = require("../repositories/guest.repository");
const vehicleAssignmentRepository = require("../repositories/vehicleAssignment.repository");
const clientInvoiceRepository = require("../repositories/clientInvoice.repository");
const guestAssignmentRepository = require("../repositories/guestAssignment.repository");
const dutyRepository = require("../repositories/duty.repository");
const trackingRepository = require("../repositories/tracking.repository");

const AppError = require("../utils/AppError");

const {
    BILL_STATUS,
    EVENT_STATUS,
    PICKUP_STATUS,
    RETURN_STATUS,
} = require("../constants/status");

/**
 * Dashboard
 */
const getDashboard = async (clientId) => {
    const events = await eventRepository.findByClient(clientId);
    const invoices = await clientInvoiceRepository.findByClient(clientId);

    return {
        totalEvents: events.length,
        totalInvoices: invoices.length,
        pendingInvoices: invoices.filter(
            (invoice) => invoice.status !== BILL_STATUS.PAID
        ).length,
        completedEvents: events.filter(
            (event) => event.status === EVENT_STATUS.COMPLETED
        ).length,
    };
};

/**
 * Get Events
 */
const getEvents = async (clientId) => {
    return eventRepository.findByClient(clientId);
};

/**
 * Get Event Details
 */
const getEventDetails = async (eventId, clientId) => {
    const event = await eventRepository.findById(eventId);

    if (!event) {
        throw new AppError("Event not found.", 404);
    }

    const eventClientId = event.client?._id || event.client;

    if (
        !eventClientId ||
        eventClientId.toString() !== clientId.toString()
    ) {
        throw new AppError("Unauthorized.", 403);
    }

    return event;
};

/**
 * Get Guests
 */
const getGuests = async (eventId, clientId) => {
    await getEventDetails(eventId, clientId);

    return guestRepository.findByEventWithAssignment(eventId);
};

/**
 * Get Vehicles
 */
const getVehicles = async (eventId, clientId) => {
    await getEventDetails(eventId, clientId);

    return vehicleAssignmentRepository.findByEvent(eventId);
};

/**
 * Get All Client Invoices
 */
const getInvoices = async (clientId) => {
    return clientInvoiceRepository.findByClient(clientId);
};

/**
 * Get Single Invoice
 */
const getInvoice = async (invoiceId, clientId) => {
    const invoice = await clientInvoiceRepository.findById(invoiceId);

    if (!invoice) {
        throw new AppError("Invoice not found.", 404);
    }

    const invoiceClientId = invoice.client?._id || invoice.client;

    if (
        !invoiceClientId ||
        invoiceClientId.toString() !== clientId.toString()
    ) {
        throw new AppError("Unauthorized.", 403);
    }

    return invoice;
};

/**
 * Event Overview
 */
const getEventOverview = async (eventId, clientId) => {
    const event = await getEventDetails(eventId, clientId);

    const guests = await guestRepository.findByEvent(eventId);

    const vehicleAssignments =
        await vehicleAssignmentRepository.findByEvent(eventId);

    const guestAssignments =
        await guestAssignmentRepository.findByEvent(eventId);

    const totalGuests = guests.length;
    const assignedGuests = guestAssignments.length;

    const pickedUpGuests = guestAssignments.filter(
        (assignment) =>
            assignment.pickupStatus === PICKUP_STATUS.PICKED_UP ||
            assignment.pickupStatus === PICKUP_STATUS.DROPPED_AT_VENUE
    ).length;

    const droppedGuests = guestAssignments.filter(
        (assignment) =>
            assignment.returnStatus === RETURN_STATUS.DROPPED
    ).length;

    const pendingGuests = Math.max(
        totalGuests - assignedGuests,
        0
    );

    const liveStatus = await getLiveTracking(eventId, clientId);

    return {
        event,
        guests,
        vehicleAssignments,
        guestAssignments,
        liveStatus,
        statistics: {
            totalGuests,
            assignedGuests,
            pickedUpGuests,
            droppedGuests,
            pendingGuests,
        },
    };
};

/**
 * Live Tracking
 */
const getLiveTracking = async (eventId, clientId) => {
    await getEventDetails(eventId, clientId);

    const assignments =
        await vehicleAssignmentRepository.findByEvent(eventId);

    const tracking = [];

    for (const assignment of assignments) {
        const duty =
            await dutyRepository.findByVehicleAssignment(
                assignment._id
            );

        if (!duty || duty.status !== "STARTED") {
            continue;
        }

        const latest =
            await trackingRepository.findLatestByDuty(
                duty._id
            );

        if (!latest) {
            continue;
        }

        tracking.push({
            duty: duty._id,
            driver: assignment.driver,
            vehicle: assignment.vehicle,
            vendor: assignment.vendor,
            location: latest,
        });
    }

    return tracking;
};

/**
 * Get Drivers
 */
const getDrivers = async (eventId, clientId) => {
    await getEventDetails(eventId, clientId);

    const assignments =
        await vehicleAssignmentRepository.findByEvent(eventId);

    return assignments.map((assignment) => ({
        driver: assignment.driver,
        vehicle: assignment.vehicle,
        vendor: assignment.vendor,
    }));
};

module.exports = {
    getDashboard,
    getEvents,
    getEventDetails,
    getGuests,
    getVehicles,
    getInvoices,
    getInvoice,
    getEventOverview,
    getDrivers,
    getLiveTracking,
};