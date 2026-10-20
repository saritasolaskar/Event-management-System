const commercialPackageService =
    require("../services/commercialPackage.service");

const createCommercialPackage = async (
    req,
    res,
    next
) => {
    try {
        const commercialPackage =
            await commercialPackageService.createCommercialPackage(
                req.body,
                req.user._id
            );

        res.status(201).json({
            success: true,
            data: commercialPackage,
        });
    } catch (error) {
        next(error);
    }
};

const getAllCommercialPackages = async (
    req,
    res,
    next
) => {
    try {
        const packages =
            await commercialPackageService.getAllCommercialPackages();

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
            await commercialPackageService.getActiveCommercialPackages();

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
            await commercialPackageService.getCommercialPackageById(
                req.params.id
            );

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
            await commercialPackageService.updateCommercialPackage(
                req.params.id,
                req.body,
                req.user._id
            );

        res.status(200).json({
            success: true,
            data: commercialPackage,
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
        await commercialPackageService.deleteCommercialPackage(
            req.params.id,
            req.user._id
        );

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