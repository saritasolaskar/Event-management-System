const commercialPackageRepository =
    require("../repositories/commercialPackage.repository");

const vehicleAssignmentRepository =
    require("../repositories/vehicleAssignment.repository");

const AppError =
    require("../utils/AppError");

const createCommercialPackage = async (
    data,
    userId
) => {
    return commercialPackageRepository.create({
        ...data,
        createdBy: userId,
        updatedBy: userId,
    });
};

const getAllCommercialPackages = async () => {
    return commercialPackageRepository.findAll();
};

const getActiveCommercialPackages = async () => {
    return commercialPackageRepository.findActive();
};

const getCommercialPackageById = async (id) => {
    const commercialPackage =
        await commercialPackageRepository.findById(id);

    if (!commercialPackage) {
        throw new AppError(
            "Commercial Package not found.",
            404
        );
    }

    return commercialPackage;
};

const updateCommercialPackage = async (
    id,
    data,
    userId
) => {
    await getCommercialPackageById(id);

    return commercialPackageRepository.updateById(
        id,
        {
            ...data,
            updatedBy: userId,
        }
    );
};

const deleteCommercialPackage = async (
    id,
    userId
) => {
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

    return commercialPackageRepository.updateById(
        id,
        {
            isDeleted: true,
            isActive: false,
            updatedBy: userId,
        }
    );
};

module.exports = {
    createCommercialPackage,
    getAllCommercialPackages,
    getActiveCommercialPackages,
    getCommercialPackageById,
    updateCommercialPackage,
    deleteCommercialPackage,
};