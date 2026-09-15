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
    DUTY_STATUS,
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
 * Get Guests with their Assignment Details
 */
const getGuests = async (eventId, clientId) => {
    await getEventDetails(eventId, clientId);

    const guests = await guestRepository.findByEvent(eventId);
    const guestAssignments =
        await guestAssignmentRepository.findByEvent(eventId);

    const assignmentMap = new Map();
    for (const assignment of guestAssignments) {
        if (assignment.guest) {
            const gId = assignment.guest._id
                ? assignment.guest._id.toString()
                : assignment.guest.toString();
            assignmentMap.set(gId, assignment);
        }
    }

    return guests.map((guest) => {
        const guestDoc = guest.toObject ? guest.toObject() : guest;
        const assignment = assignmentMap.get(guest._id.toString());

        return {
            ...guestDoc,
            assignment: assignment
                ? {
                      _id: assignment._id,
                      vehicleAssignment:
                          assignment.vehicleAssignment?._id ||
                          assignment.vehicleAssignment,
                      vehicle:
                          assignment.vehicleAssignment?.vehicle || null,
                      driver:
                          assignment.vehicleAssignment?.driver || null,
                      pickupSequence: assignment.pickupSequence,
                      dropSequence: assignment.dropSequence,
                      pickupStatus: assignment.pickupStatus,
                      returnStatus: assignment.returnStatus,
                      pickupTime: assignment.pickupTime,
                      venueArrivalTime: assignment.venueArrivalTime,
                      returnPickupTime: assignment.returnPickupTime,
                      dropTime: assignment.dropTime,
                      remarks: assignment.remarks,
                  }
                : null,
        };
    });
};

/**
 * Get Vehicles
 */
const getVehicles = async (eventId, clientId) => {
    await getEventDetails(eventId, clientId);

    const assignments =
        await vehicleAssignmentRepository.findByEvent(eventId);

    return assignments.map((assignment) => ({
        assignmentId: assignment._id,
        status: assignment.status,
        vehicle: assignment.vehicle,
        driver: assignment.driver
            ? {
                  _id: assignment.driver._id,
                  name: assignment.driver.name,
                  phone: assignment.driver.phone,
              }
            : null,
        startDate: assignment.startDate,
        endDate: assignment.endDate,
    }));
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
 * Event Overview - Comprehensive Transport Manifest
 */
const getEventOverview = async (eventId, clientId) => {
    const event = await getEventDetails(eventId, clientId);

    const guests = await guestRepository.findByEvent(eventId);
    const vehicleAssignments =
        await vehicleAssignmentRepository.findByEvent(eventId);
    const guestAssignments =
        await guestAssignmentRepository.findByEvent(eventId);

    const assignmentMap = new Map();
    for (const ga of guestAssignments) {
        if (ga.guest) {
            const gId = ga.guest._id
                ? ga.guest._id.toString()
                : ga.guest.toString();
            assignmentMap.set(gId, ga);
        }
    }

    const manifest = guests.map((guest) => {
        const ga = assignmentMap.get(guest._id.toString());
        const va = ga?.vehicleAssignment;

        return {
            guest: {
                id: guest._id,
                name: `${guest.firstName} ${guest.lastName || ""}`.trim(),
                phone: guest.phone,
                email: guest.email,
                guestCode: guest.guestCode,
            },
            pickupLocation: guest.pickupLocation,
            dropLocation: guest.dropLocation,
            assignmentStatus: va ? va.status : "UNASSIGNED",
            cab: va?.vehicle
                ? {
                      id: va.vehicle._id,
                      vehicleNumber: va.vehicle.vehicleNumber,
                      model: va.vehicle.model,
                      vehicleType: va.vehicle.vehicleType,
                  }
                : null,
            driver: va?.driver
                ? {
                      id: va.driver._id,
                      name: va.driver.name,
                      phone: va.driver.phone,
                  }
                : null,
            pickupSequence: ga?.pickupSequence || null,
            dropSequence: ga?.dropSequence || null,
            pickupStatus: ga?.pickupStatus || PICKUP_STATUS.PENDING,
            returnStatus: ga?.returnStatus || RETURN_STATUS.NOT_STARTED,
            pickupTime: ga?.pickupTime || null,
            dropTime: ga?.dropTime || null,
            remarks: ga?.remarks || null,
        };
    });

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
        statistics: {
            totalGuests,
            assignedGuests,
            pickedUpGuests,
            droppedGuests,
            pendingGuests,
            totalCabs: vehicleAssignments.length,
        },
        manifest,
        liveStatus,
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

        if (!duty || duty.status !== DUTY_STATUS.STARTED) {
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
            driver: assignment.driver
                ? {
                      _id: assignment.driver._id,
                      name: assignment.driver.name,
                      phone: assignment.driver.phone,
                  }
                : null,
            vehicle: assignment.vehicle
                ? {
                      _id: assignment.vehicle._id,
                      vehicleNumber: assignment.vehicle.vehicleNumber,
                      model: assignment.vehicle.model,
                  }
                : null,
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
        assignmentId: assignment._id,
        status: assignment.status,
        driver: assignment.driver
            ? {
                  _id: assignment.driver._id,
                  name: assignment.driver.name,
                  phone: assignment.driver.phone,
                  licenseNumber: assignment.driver.licenseNumber,
                  status: assignment.driver.status,
              }
            : null,
        vehicle: assignment.vehicle
            ? {
                  _id: assignment.vehicle._id,
                  vehicleNumber: assignment.vehicle.vehicleNumber,
                  model: assignment.vehicle.model,
                  vehicleType: assignment.vehicle.vehicleType,
                  capacity:
                      assignment.vehicle.seatingCapacity ||
                      assignment.vehicle.capacity,
              }
            : null,
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