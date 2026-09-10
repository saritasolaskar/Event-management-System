const guestRepository =
    require("../repositories/guest.repository");

const guestAssignmentRepository =
    require("../repositories/guestAssignment.repository");

const eventRepository =
    require("../repositories/event.repository");

const locationRepository =
    require("../repositories/location.repository");

const AppError =
    require("../utils/AppError");

const {
    EVENT_STATUS,
    GUEST_STATUS,
} = require("../constants/status");

/**
 * Validate that an event can accept guest changes.
 */
const validateEventForGuestChange =
    async (eventId) => {

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
            event.status !==
            EVENT_STATUS.UPCOMING
        ) {
            throw new AppError(
                "Guests can only be created or structurally modified for upcoming events.",
                400
            );
        }

        return event;
    };

/**
 * Create Guest
 */
const createGuest = async (
    guestData,
    userId
) => {

    const event =
        await validateEventForGuestChange(
            guestData.event
        );

    const pickupLocation =
        await locationRepository.findById(
            guestData.pickupLocation
        );

    if (!pickupLocation) {
        throw new AppError(
            "Pickup location not found.",
            404
        );
    }

    const dropLocation =
        await locationRepository.findById(
            guestData.dropLocation
        );

    if (!dropLocation) {
        throw new AppError(
            "Drop location not found.",
            404
        );
    }

    const existingGuest =
        await guestRepository.findByGuestCode(
            guestData.guestCode
        );

    if (existingGuest) {
        throw new AppError(
            "Guest code already exists.",
            409
        );
    }

    const allowedData = {
        guestCode:
            guestData.guestCode,

        event:
            event._id,

        firstName:
            guestData.firstName,

        lastName:
            guestData.lastName,

        email:
            guestData.email,

        phone:
            guestData.phone,

        gender:
            guestData.gender,

        pickupLocation:
            pickupLocation._id,

        dropLocation:
            dropLocation._id,

        hotelName:
            guestData.hotelName,

        roomNumber:
            guestData.roomNumber,

        flightNumber:
            guestData.flightNumber,

        arrivalTime:
            guestData.arrivalTime,

        departureTime:
            guestData.departureTime,

        remarks:
            guestData.remarks,

        status:
            GUEST_STATUS.PENDING,

        createdBy:
            userId,

        updatedBy:
            userId,
    };

    try {
        return await guestRepository.create(
            allowedData
        );
    } catch (error) {

        if (error.code === 11000) {
            throw new AppError(
                "Guest code already exists.",
                409
            );
        }

        throw error;
    }
};

/**
 * Get All Guests
 */
const getAllGuests = async () => {
    return guestRepository.findAll();
};

/**
 * Get Guests By Event
 */
const getGuestsByEvent = async (
    eventId
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

    return guestRepository.findByEvent(
        eventId
    );
};

/**
 * Get Guest By ID
 */
const getGuestById = async (
    guestId
) => {

    const guest =
        await guestRepository.findById(
            guestId
        );

    if (!guest) {
        throw new AppError(
            "Guest not found.",
            404
        );
    }

    return guest;
};

/**
 * Update Guest
 */
const updateGuest = async (
    guestId,
    updateData,
    userId
) => {

    const guest =
        await guestRepository.findById(
            guestId
        );

    if (!guest) {
        throw new AppError(
            "Guest not found.",
            404
        );
    }

    const currentEventId =
        guest.event?._id ||
        guest.event;

    const targetEventId =
        updateData.event ||
        currentEventId;

    const currentEvent =
        await eventRepository.findById(
            currentEventId
        );

    if (!currentEvent) {
        throw new AppError(
            "Event not found.",
            404
        );
    }

    const eventChanged =
        targetEventId.toString() !==
        currentEventId.toString();

    if (
        eventChanged ||
        Object.keys(updateData).some(
            (key) =>
                key !== "status"
        )
    ) {
        await validateEventForGuestChange(
            targetEventId
        );
    }

    if (
        updateData.pickupLocation
    ) {

        const pickupLocation =
            await locationRepository.findById(
                updateData.pickupLocation
            );

        if (!pickupLocation) {
            throw new AppError(
                "Pickup location not found.",
                404
            );
        }
    }

    if (
        updateData.dropLocation
    ) {

        const dropLocation =
            await locationRepository.findById(
                updateData.dropLocation
            );

        if (!dropLocation) {
            throw new AppError(
                "Drop location not found.",
                404
            );
        }
    }

    const allowedFields = [
        "event",
        "firstName",
        "lastName",
        "email",
        "phone",
        "gender",
        "pickupLocation",
        "dropLocation",
        "hotelName",
        "roomNumber",
        "flightNumber",
        "arrivalTime",
        "departureTime",
        "remarks",
    ];

    const sanitizedData = {};

    for (
        const field of allowedFields
    ) {
        if (
            updateData[field] !==
            undefined
        ) {
            sanitizedData[field] =
                updateData[field];
        }
    }

    sanitizedData.updatedBy =
        userId;

    const updatedGuest =
        await guestRepository.updateById(
            guestId,
            sanitizedData
        );

    if (!updatedGuest) {
        throw new AppError(
            "Guest could not be updated.",
            409
        );
    }

    return updatedGuest;
};

/**
 * Delete Guest
 */
const deleteGuest = async (
    guestId
) => {

    const guest =
        await guestRepository.findById(
            guestId
        );

    if (!guest) {
        throw new AppError(
            "Guest not found.",
            404
        );
    }

    const assignment =
        await guestAssignmentRepository.findByGuest(
            guestId
        );

    if (assignment) {
        throw new AppError(
            "Guest cannot be deleted while assigned to a vehicle.",
            409
        );
    }

    const deletedGuest =
        await guestRepository.softDelete(
            guestId
        );

    if (!deletedGuest) {
        throw new AppError(
            "Guest could not be deleted.",
            409
        );
    }
};

/**
 * Update Guest Status
 */
const updateGuestStatus = async (
    guestId,
    status
) => {

    const guest =
        await guestRepository.findById(
            guestId
        );

    if (!guest) {
        throw new AppError(
            "Guest not found.",
            404
        );
    }

    const currentStatus =
        guest.status;

    if (
        currentStatus ===
        GUEST_STATUS.CANCELLED
    ) {
        throw new AppError(
            "Cancelled guest cannot change status.",
            400
        );
    }

    const allowedTransitions = {
        [GUEST_STATUS.PENDING]: [
            GUEST_STATUS.CONFIRMED,
            GUEST_STATUS.CANCELLED,
        ],

        [GUEST_STATUS.CONFIRMED]: [
            GUEST_STATUS.CANCELLED,
        ],
    };

    const allowed =
        allowedTransitions[
            currentStatus
        ] || [];

    if (
        !allowed.includes(status)
    ) {
        throw new AppError(
            `Invalid guest status transition from ${currentStatus} to ${status}.`,
            400
        );
    }

    const updatedGuest =
        await guestRepository.updateStatus(
            guestId,
            status
        );

    if (!updatedGuest) {
        throw new AppError(
            "Guest status could not be updated.",
            409
        );
    }

    return updatedGuest;
};

module.exports = {
    createGuest,
    getAllGuests,
    getGuestsByEvent,
    getGuestById,
    updateGuest,
    deleteGuest,
    updateGuestStatus,
};