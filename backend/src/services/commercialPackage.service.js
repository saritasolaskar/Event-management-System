const commercialPackageRepository =
    require("../repositories/commercialPackage.repository");

const vehicleAssignmentRepository =
    require("../repositories/vehicleAssignment.repository");

const auditLogService =
    require("./auditLog.service");

const AppError =
    require("../utils/AppError");

/**
 * Fields that are allowed to come from the API request.
 *
 * createdBy, updatedBy and isDeleted must never be
 * controlled by the client.
 */
const PACKAGE_FIELDS = [
    "name",
    "description",

    "vendorBaseRate",
    "vendorIncludedKm",
    "vendorExtraKmRate",
    "vendorIncludedHours",
    "vendorExtraHourRate",

    "clientBaseRate",
    "clientIncludedKm",
    "clientExtraKmRate",
    "clientIncludedHours",
    "clientExtraHourRate",

    "isActive",
];

/**
 * Pick only allowed package fields.
 */
const pickPackageFields = (data) => {
    const sanitizedData = {};

    for (const field of PACKAGE_FIELDS) {
        if (data[field] !== undefined) {
            sanitizedData[field] = data[field];
        }
    }

    return sanitizedData;
};

/**
 * Create Commercial Package
 */
const createCommercialPackage = async (
    data,
    userId
) => {
    const packageData =
        pickPackageFields(data);

    const commercialPackage =
        await commercialPackageRepository.create({
            ...packageData,

            createdBy:
                userId,

            updatedBy:
                userId,

            isDeleted:
                false,
        });

    await auditLogService.createLog({
        user: userId,

        action:
            "CREATE",

        module:
            "COMMERCIAL_PACKAGE",

        referenceId:
            commercialPackage._id,

        description:
            `Created commercial package ${commercialPackage.name}.`,
    });

    return commercialPackage;
};

/**
 * Get All Commercial Packages
 */
const getAllCommercialPackages = async () => {
    return commercialPackageRepository.findAll();
};

/**
 * Get Active Commercial Packages
 */
const getActiveCommercialPackages = async () => {
    return commercialPackageRepository.findActive();
};

/**
 * Get Commercial Package By ID
 */
const getCommercialPackageById = async (
    id
) => {
    const commercialPackage =
        await commercialPackageRepository.findById(
            id
        );

    if (!commercialPackage) {
        throw new AppError(
            "Commercial Package not found.",
            404
        );
    }

    return commercialPackage;
};

/**
 * Update Commercial Package
 */
const updateCommercialPackage = async (
    id,
    data,
    userId
) => {
    const existingPackage =
        await getCommercialPackageById(id);

    const packageData =
        pickPackageFields(data);

    if (
        Object.keys(packageData).length === 0
    ) {
        throw new AppError(
            "No valid Commercial Package fields provided for update.",
            400
        );
    }

    const updatedPackage =
        await commercialPackageRepository.updateById(
            id,
            {
                ...packageData,

                updatedBy:
                    userId,
            }
        );

    if (!updatedPackage) {
        throw new AppError(
            "Commercial Package could not be updated.",
            409
        );
    }

    await auditLogService.createLog({
        user: userId,

        action:
            "UPDATE",

        module:
            "COMMERCIAL_PACKAGE",

        referenceId:
            updatedPackage._id,

        description:
            `Updated commercial package ${updatedPackage.name}.`,
    });

    return updatedPackage;
};

/**
 * Delete Commercial Package
 */
const deleteCommercialPackage = async (
    id,
    userId
) => {
    const commercialPackage =
        await getCommercialPackageById(id);

    const assignments =
        await vehicleAssignmentRepository.findByCommercialPackage(
            id
        );

    if (assignments.length > 0) {
        throw new AppError(
            "Commercial Package is already assigned to vehicle assignments and cannot be deleted.",
            400
        );
    }

    const deletedPackage =
        await commercialPackageRepository.updateById(
            id,
            {
                isDeleted:
                    true,

                isActive:
                    false,

                updatedBy:
                    userId,
            }
        );

    if (!deletedPackage) {
        throw new AppError(
            "Commercial Package could not be deleted.",
            409
        );
    }

    await auditLogService.createLog({
        user: userId,

        action:
            "DELETE",

        module:
            "COMMERCIAL_PACKAGE",

        referenceId:
            commercialPackage._id,

        description:
            `Deleted commercial package ${commercialPackage.name}.`,
    });

    return deletedPackage;
};

module.exports = {
    createCommercialPackage,
    getAllCommercialPackages,
    getActiveCommercialPackages,
    getCommercialPackageById,
    updateCommercialPackage,
    deleteCommercialPackage,
};