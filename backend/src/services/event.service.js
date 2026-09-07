const eventRepository =
    require("../repositories/event.repository");

const clientRepository =
    require("../repositories/client.repository");

const locationRepository =
    require("../repositories/location.repository");

const guestRepository =
    require("../repositories/guest.repository");

const vehicleAssignmentRepository =
    require("../repositories/vehicleAssignment.repository");

const guestAssignmentRepository =
    require("../repositories/guestAssignment.repository");

const notificationService =
    require("./notification.service");

const auditLogService =
    require("./auditLog.service");

const {
    EVENT_STATUS,
} = require("../constants/status");

const {
    ROLES,
} = require("../constants/roles");

const AppError =
    require("../utils/AppError");

/**
 * Validate Event Date Range
 */
const validateDateRange = (
    startDate,
    endDate
) => {
    const start =
        new Date(startDate);

    const end =
        new Date(endDate);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        throw new AppError(
            "Invalid event dates.",
            400
        );
    }

    if (start > end) {
        throw new AppError(
            "Start date cannot be greater than end date.",
            400
        );
    }
};

/**
 * Check whether event has operational data.
 */
const hasOperationalData = async (
    eventId
) => {
    const [
        guests,
        vehicleAssignments,
        guestAssignments,
    ] = await Promise.all([
        guestRepository.findByEvent(
            eventId
        ),

        vehicleAssignmentRepository.findByEvent(
            eventId
        ),

        guestAssignmentRepository.findByEvent(
            eventId
        ),
    ]);

    return (
        guests.length > 0 ||
        vehicleAssignments.length > 0 ||
        guestAssignments.length > 0
    );
};

/**
 * Create Event
 */
const createEvent = async (
    eventData,
    userId
) => {
    const eventCode =
        eventData.eventCode
            ?.trim()
            .toUpperCase();

    const existingEvent =
        await eventRepository.findByEventCode(
            eventCode
        );

    if (existingEvent) {
        throw new AppError(
            "Event code already exists.",
            409
        );
    }

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

    validateDateRange(
        eventData.startDate,
        eventData.endDate
    );

    // Explicit whitelist.
    const data = {
        eventCode,
        name:
            eventData.name.trim(),
        client:
            eventData.client,
        venue:
            eventData.venue,
        startDate:
            eventData.startDate,
        endDate:
            eventData.endDate,
        description:
            eventData.description,
        // New events always start as UPCOMING.
        status:
            EVENT_STATUS.UPCOMING,
        createdBy:
            userId,
        updatedBy:
            userId,
    };

    let event;

    try {
        event =
            await eventRepository.create(
                data
            );
    } catch (error) {
        if (
            error.code === 11000
        ) {
            throw new AppError(
                "Event code already exists.",
                409
            );
        }

        throw error;
    }

    await notificationService.createNotification(
        {
            recipientUser: userId,

            title:
                "Event Created",

            message:
                `Event ${event.eventCode} has been created successfully.`,

            type:
                "EVENT_CREATED",

            referenceType:
                "EVENT",

            referenceId:
                event._id,
        }
    );

    await auditLogService.createLog(
        {
            user: userId,

            action:
                "CREATE",

            module:
                "EVENT",

            referenceId:
                event._id,

            description:
                `Created event ${event.eventCode}.`,
        }
    );

    return event;
};

/**
 * Get All Events
 */
const getAllEvents = async (
    user = null
) => {
    if (
        user?.role === ROLES.CLIENT
    ) {
        if (!user.client) {
            throw new AppError(
                "Client profile not found.",
                403
            );
        }

        return eventRepository.findByClient(
            user.client
        );
    }

    return eventRepository.findAll();
};

/**
 * Get Event By ID
 */
const getEventById = async (
    eventId,
    user = null
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

    if (
        user?.role === ROLES.CLIENT
    ) {
        if (!user.client) {
            throw new AppError(
                "Client profile not found.",
                403
            );
        }

        const eventClientId =
            event.client?._id ||
            event.client;

        if (
            !eventClientId ||
            eventClientId.toString() !==
                user.client.toString()
        ) {
            throw new AppError(
                "Unauthorized.",
                403
            );
        }
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
     * Event status must be changed only
     * through PATCH /:id/status.
     */
    if (
        Object.prototype.hasOwnProperty.call(
            updateData,
            "status"
        )
    ) {
        throw new AppError(
            "Event status must be changed using the status endpoint.",
            400
        );
    }

    const nextEventCode =
        updateData.eventCode !==
        undefined
            ? updateData.eventCode
                  .trim()
                  .toUpperCase()
            : event.eventCode;

    if (
        nextEventCode !==
        event.eventCode
    ) {
        const existingEvent =
            await eventRepository.findByEventCode(
                nextEventCode
            );

        if (
            existingEvent &&
            existingEvent._id.toString() !==
                eventId.toString()
        ) {
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

    const nextStartDate =
        updateData.startDate ??
        event.startDate;

    const nextEndDate =
        updateData.endDate ??
        event.endDate;

    validateDateRange(
        nextStartDate,
        nextEndDate
    );

    /*
     * Do not allow structural event changes
     * after the event has started/completed.
     */
    if (
        event.status !==
        EVENT_STATUS.UPCOMING
    ) {
        const structuralChange =
            updateData.client !==
                undefined ||
            updateData.venue !==
                undefined ||
            updateData.startDate !==
                undefined ||
            updateData.endDate !==
                undefined;

        if (structuralChange) {
            throw new AppError(
                "Client, venue and event dates cannot be changed after the event has started.",
                400
            );
        }
    }

    // Explicit whitelist.
    const data = {
        updatedBy: userId,
    };

    if (
        updateData.eventCode !==
        undefined
    ) {
        data.eventCode =
            nextEventCode;
    }

    if (
        updateData.name !==
        undefined
    ) {
        data.name =
            updateData.name.trim();
    }

    if (
        updateData.client !==
        undefined
    ) {
        data.client =
            updateData.client;
    }

    if (
        updateData.venue !==
        undefined
    ) {
        data.venue =
            updateData.venue;
    }

    if (
        updateData.startDate !==
        undefined
    ) {
        data.startDate =
            updateData.startDate;
    }

    if (
        updateData.endDate !==
        undefined
    ) {
        data.endDate =
            updateData.endDate;
    }

    if (
        updateData.description !==
        undefined
    ) {
        data.description =
            updateData.description;
    }

    let updatedEvent;

    try {
        updatedEvent =
            await eventRepository.updateById(
                eventId,
                data
            );
    } catch (error) {
        if (
            error.code === 11000
        ) {
            throw new AppError(
                "Event code already exists.",
                409
            );
        }

        throw error;
    }

    if (!updatedEvent) {
        throw new AppError(
            "Event could not be updated.",
            409
        );
    }

    await auditLogService.createLog(
        {
            user: userId,
            action:
                "UPDATE",
            module:
                "EVENT",
            referenceId:
                updatedEvent._id,
            description:
                `Updated event ${updatedEvent.eventCode}.`,
        }
    );

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
        await eventRepository.findById(
            eventId
        );

    if (!event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    const hasData =
        await hasOperationalData(
            eventId
        );

    if (hasData) {
        throw new AppError(
            "Event cannot be deleted because operational data already exists for this event.",
            409
        );
    }

    const deletedEvent =
        await eventRepository.softDelete(
            eventId
        );

    if (!deletedEvent) {
        throw new AppError(
            "Event could not be deleted.",
            409
        );
    }

    await auditLogService.createLog(
        {
            user: userId,
            action:
                "DELETE",
            module:
                "EVENT",
            referenceId:
                event._id,
            description:
                `Deleted event ${event.eventCode}.`,
        }
    );
};

/**
 * Validate Event Status Transition
 */
const validateStatusTransition = (
    currentStatus,
    nextStatus
) => {
    if (
        currentStatus ===
        nextStatus
    ) {
        return;
    }

    const allowedTransitions = {
        [EVENT_STATUS.UPCOMING]: [
            EVENT_STATUS.ONGOING,
            EVENT_STATUS.CANCELLED,
        ],

        [EVENT_STATUS.ONGOING]: [
            EVENT_STATUS.COMPLETED,
            EVENT_STATUS.CANCELLED,
        ],

        [EVENT_STATUS.COMPLETED]: [],

        [EVENT_STATUS.CANCELLED]: [],
    };

    const allowed =
        allowedTransitions[
            currentStatus
        ] || [];

    if (
        !allowed.includes(
            nextStatus
        )
    ) {
        throw new AppError(
            `Invalid event status transition from ${currentStatus} to ${nextStatus}.`,
            400
        );
    }
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
        await eventRepository.findById(
            eventId
        );

    if (!event) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    validateStatusTransition(
        event.status,
        status
    );

    const updatedEvent =
        await eventRepository.updateStatus(
            eventId,
            status
        );

    if (!updatedEvent) {
        throw new AppError(
            "Event status could not be updated.",
            409
        );
    }

    await notificationService.createNotification(
        {
            recipientUser:
                userId,

            title:
                "Event Status Updated",

            message:
                `Event ${updatedEvent.eventCode} status changed to ${status}.`,

            type:
                "SYSTEM",

            referenceType:
                "EVENT",

            referenceId:
                updatedEvent._id,
        }
    );

    await auditLogService.createLog(
        {
            user: userId,

            action:
                "UPDATE",

            module:
                "EVENT",

            referenceId:
                updatedEvent._id,

            description:
                `Updated event status to ${status}.`,
        }
    );

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