const commercialPackageRepository =
    require("../repositories/commercialPackage.repository");

const AppError =
    require("../utils/AppError");

const createCommercialPackage = async (req, res, next) => {
    try {
        const packageData = {
            ...req.body,
            createdBy: req.user._id,
            updatedBy: req.user._id,
        };

        const commercialPackage =
            await commercialPackageRepository.create(
                packageData
            );

        res.status(201).json({
            success: true,
            data: commercialPackage,
        });
    } catch (error) {
        next(error);
    }
};

const getAllCommercialPackages = async (req, res, next) => {
    try {
        const packages =
            await commercialPackageRepository.findAll();

        res.status(200).json({
            success: true,
            data: packages,
        });
    } catch (error) {
        next(error);
    }
};

const getActiveCommercialPackages = async (
    req,
    res,
    next
) => {
    try {
        const packages =
            await commercialPackageRepository.findActive();

        res.status(200).json({
            success: true,
            data: packages,
        });
    } catch (error) {
        next(error);
    }
};

const getCommercialPackageById = async (
    req,
    res,
    next
) => {
    try {
        const commercialPackage =
            await commercialPackageRepository.findById(
                req.params.id
            );

        if (!commercialPackage) {
            throw new AppError(
                "Commercial Package not found.",
                404
            );
        }

        res.status(200).json({
            success: true,
            data: commercialPackage,
        });
    } catch (error) {
        next(error);
    }
};

const updateCommercialPackage = async (
    req,
    res,
    next
) => {
    try {
        const commercialPackage =
            await commercialPackageRepository.findById(
                req.params.id
            );

        if (!commercialPackage) {
            throw new AppError(
                "Commercial Package not found.",
                404
            );
        }

        const updated =
            await commercialPackageRepository.updateById(
                req.params.id,
                {
                    ...req.body,
                    updatedBy: req.user._id,
                }
            );

        res.status(200).json({
            success: true,
            data: updated,
        });
    } catch (error) {
        next(error);
    }
};

const deleteCommercialPackage = async (
    req,
    res,
    next
) => {
    try {
        const commercialPackage =
            await commercialPackageRepository.softDelete(
                req.params.id
            );

        if (!commercialPackage) {
            throw new AppError(
                "Commercial Package not found.",
                404
            );
        }

        res.status(200).json({
            success: true,
            message:
                "Commercial Package deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCommercialPackage,
    getAllCommercialPackages,
    getActiveCommercialPackages,
    getCommercialPackageById,
    updateCommercialPackage,
    deleteCommercialPackage,
};