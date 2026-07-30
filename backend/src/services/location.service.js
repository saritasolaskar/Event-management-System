const locationRepository = require("../repositories/location.repository");

const AppError = require("../utils/appError");

/**
 * Create Location
 */
const createLocation = async (
    locationData,
    userId
) => {

    const existingLocation =
        await locationRepository.findByLocationCode(
            locationData.locationCode
        );

    if (existingLocation) {
        throw new AppError(
            "Location code already exists.",
            409
        );
    }

    locationData.createdBy = userId;
    locationData.updatedBy = userId;

    return await locationRepository.create(
        locationData
    );
};

/**
 * Get All Locations
 */
const getAllLocations = async () => {

    return await locationRepository.findAll();

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

    if (
        updateData.locationCode &&
        updateData.locationCode !==
            location.locationCode
    ) {

        const existingLocation =
            await locationRepository.findByLocationCode(
                updateData.locationCode
            );

        if (existingLocation) {
            throw new AppError(
                "Location code already exists.",
                409
            );
        }
    }

    updateData.updatedBy = userId;

    return await locationRepository.updateById(
        locationId,
        updateData
    );
};

/**
 * Delete Location
 */
const deleteLocation = async (
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

    await locationRepository.softDelete(
        locationId
    );

    return {
        message:
            "Location deleted successfully."
    };
};

/**
 * Update Location Status
 */
const updateLocationStatus = async (
    locationId,
    status
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

    return await locationRepository.updateStatus(
        locationId,
        status
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