const locationRepository =
    require("../repositories/location.repository");

const eventRepository =
    require("../repositories/event.repository");

const AppError =
    require("../utils/AppError");

const {
    STATUS,
} = require("../constants/status");

const LOCATION_FIELDS = [
    "locationCode",
    "name",
    "address",
    "city",
    "state",
    "country",
    "pincode",
    "latitude",
    "longitude",
    "landmark",
];

/**
 * Pick only allowed fields.
 */
const pickLocationFields = (data) => {
    return Object.fromEntries(
        LOCATION_FIELDS
            .filter((field) =>
                Object.prototype.hasOwnProperty.call(
                    data,
                    field
                )
            )
            .map((field) => [
                field,
                data[field],
            ])
    );
};

/**
 * Create Location
 */
const createLocation = async (
    locationData,
    userId
) => {

    const data =
        pickLocationFields(locationData);

    const existingLocation =
        await locationRepository.findByLocationCode(
            data.locationCode
        );

    if (existingLocation) {
        throw new AppError(
            "Location code already exists.",
            409
        );
    }

    data.createdBy = userId;
    data.updatedBy = userId;
    data.isDeleted = false;

    return locationRepository.create(data);
};

/**
 * Get All Locations
 */
const getAllLocations = async () => {
    return locationRepository.findAll();
};

/**
 * Get Location By ID
 */
const getLocationById = async (
    locationId
) => {

    const location =
        await locationRepository.findById(
            locationId
        );

    if (!location) {
        throw new AppError(
            "Location not found.",
            404
        );
    }

    return location;
};

/**
 * Update Location
 */
const updateLocation = async (
    locationId,
    updateData,
    userId
) => {

    const location =
        await locationRepository.findById(
            locationId
        );

    if (!location) {
        throw new AppError(
            "Location not found.",
            404
        );
    }

    const data =
        pickLocationFields(updateData);

    if (
        data.locationCode &&
        data.locationCode !==
            location.locationCode
    ) {

        const existingLocation =
            await locationRepository.findByLocationCode(
                data.locationCode
            );

        if (existingLocation) {
            throw new AppError(
                "Location code already exists.",
                409
            );
        }
    }

    data.updatedBy = userId;

    const updatedLocation =
        await locationRepository.updateById(
            locationId,
            data
        );

    if (!updatedLocation) {
        throw new AppError(
            "Location not found.",
            404
        );
    }

    return updatedLocation;
};

/**
 * Delete Location
 */
const deleteLocation = async (
    locationId,
    userId
) => {

    const location =
        await locationRepository.findById(
            locationId
        );

    if (!location) {
        throw new AppError(
            "Location not found.",
            404
        );
    }

    const eventCount =
        await eventRepository.count({
            venue: locationId,
        });

    if (eventCount > 0) {
        throw new AppError(
            "Location cannot be deleted because it is being used by an event.",
            409
        );
    }

    await locationRepository.softDelete(
        locationId,
        userId
    );

    return {
        message:
            "Location deleted successfully.",
    };
};

/**
 * Update Location Status
 */
const updateLocationStatus = async (
    locationId,
    status,
    userId
) => {

    if (!Object.values(STATUS).includes(status)) {
        throw new AppError(
            "Invalid location status.",
            400
        );
    }

    const location =
        await locationRepository.findById(
            locationId
        );

    if (!location) {
        throw new AppError(
            "Location not found.",
            404
        );
    }

    if (location.status === status) {
        throw new AppError(
            `Location is already ${status}.`,
            400
        );
    }

    return locationRepository.updateStatus(
        locationId,
        status,
        userId
    );
};

module.exports = {
    createLocation,
    getAllLocations,
    getLocationById,
    updateLocation,
    deleteLocation,
    updateLocationStatus,
};