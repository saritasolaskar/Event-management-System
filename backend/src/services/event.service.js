const eventRepository = require("../repositories/event.repository");
const clientRepository = require("../repositories/client.repository");
const locationRepository = require("../repositories/location.repository");

const notificationService = require("./notification.service");
const auditLogService = require("./auditLog.service");

const AppError = require("../utils/AppError");

/**
 * Create Event
 */
const createEvent = async (eventData, userId) => {

    // Check Event Code
    const existingEvent =
        await eventRepository.findByEventCode(
            eventData.eventCode
        );

    if (existingEvent) {
        throw new AppError(
            "Event code already exists.",
            409
        );
    }

    // Check Client
    const client =
        await clientRepository.findById(
            eventData.client
        );

    if (!client) {
        throw new AppError(
            "Client not found.",
            404
        );
    }

    // Check Venue
    const venue =
        await locationRepository.findById(
            eventData.venue
        );

    if (!venue) {
        throw new AppError(
            "Venue not found.",
            404
        );
    }

    // Date Validation
    if (
        new Date(eventData.startDate) >
        new Date(eventData.endDate)
    ) {
        throw new AppError(
            "Start date cannot be greater than end date.",
            400
        );
    }

    eventData.createdBy = userId;
    eventData.updatedBy = userId;

    const event =
        await eventRepository.create(eventData);

    // Notification
    await notificationService.createNotification({

        recipientUser: userId,

        title: "Event Created",

        message: `Event ${event.eventCode} has been created successfully.`,

        type: "EVENT_CREATED",

        referenceType: "EVENT",

        referenceId: event._id,

    });

    // Audit Log
    await auditLogService.createLog({

        user: userId,

        action: "CREATE",

        module: "EVENT",

        referenceId: event._id,

        description: `Created event ${event.eventCode}.`,

    });

    return event;

};

/**
 * Get All Events
 */
const getAllEvents = async () => {

    return eventRepository.findAll();

};

/**
 * Get Event By ID
 */
const getEventById = async (eventId) => {

    const event =
        await eventRepository.findById(eventId);

    if (!event) {

        throw new AppError(
            "Event not found.",
            404
        );

    }

    return event;

};

/**
 * Update Event
 */
const updateEvent = async (

    eventId,

    updateData,

    userId

) => {

    const event =
        await eventRepository.findById(eventId);

    if (!event) {

        throw new AppError(
            "Event not found.",
            404
        );

    }

    if (

        updateData.eventCode &&

        updateData.eventCode !== event.eventCode

    ) {

        const existingEvent =
            await eventRepository.findByEventCode(
                updateData.eventCode
            );

        if (existingEvent) {

            throw new AppError(
                "Event code already exists.",
                409
            );

        }

    }

    if (updateData.client) {

        const client =
            await clientRepository.findById(
                updateData.client
            );

        if (!client) {

            throw new AppError(
                "Client not found.",
                404
            );

        }

    }

    if (updateData.venue) {

        const venue =
            await locationRepository.findById(
                updateData.venue
            );

        if (!venue) {

            throw new AppError(
                "Venue not found.",
                404
            );

        }

    }

    if (

        updateData.startDate &&

        updateData.endDate &&

        new Date(updateData.startDate) >
        new Date(updateData.endDate)

    ) {

        throw new AppError(

            "Start date cannot be greater than end date.",

            400

        );

    }

    updateData.updatedBy = userId;

    const updatedEvent =
        await eventRepository.updateById(

            eventId,

            updateData

        );

    await auditLogService.createLog({

        user: userId,

        action: "UPDATE",

        module: "EVENT",

        referenceId: updatedEvent._id,

        description: `Updated event ${updatedEvent.eventCode}.`,

    });

    return updatedEvent;

};

/**
 * Delete Event
 */
const deleteEvent = async (

    eventId,

    userId

) => {

    const event =
        await eventRepository.findById(eventId);

    if (!event) {

        throw new AppError(
            "Event not found.",
            404
        );

    }

    await eventRepository.softDelete(eventId);

    await auditLogService.createLog({

        user: userId,

        action: "DELETE",

        module: "EVENT",

        referenceId: event._id,

        description: `Deleted event ${event.eventCode}.`,

    });

};

/**
 * Update Event Status
 */
const updateEventStatus = async (

    eventId,

    status,

    userId

) => {

    const event =
        await eventRepository.findById(eventId);

    if (!event) {

        throw new AppError(
            "Event not found.",
            404
        );

    }

    const updatedEvent =
        await eventRepository.updateStatus(

            eventId,

            status

        );

    await notificationService.createNotification({

        recipientUser: updatedEvent.createdBy,

        title: "Event Status Updated",

        message: `Event ${updatedEvent.eventCode} status changed to ${status}.`,

        type: "SYSTEM",

        referenceType: "EVENT",

        referenceId: updatedEvent._id,

    });

    await auditLogService.createLog({

        user: userId,

        action: "UPDATE",

        module: "EVENT",

        referenceId: updatedEvent._id,

        description: `Updated event status to ${status}.`,

    });

    return updatedEvent;

};

module.exports = {

    createEvent,

    getAllEvents,

    getEventById,

    updateEvent,

    deleteEvent,

    updateEventStatus,

};