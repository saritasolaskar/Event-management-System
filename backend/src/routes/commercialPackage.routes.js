const express = require("express");

const router = express.Router();

const protect =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");

const controller =
    require("../controllers/commercialPackage.controller");

const validate =
    require("../middleware/validate.middleware");

const {
    commercialPackageIdValidator,
    createCommercialPackageValidator,
    updateCommercialPackageValidator,
} =
    require("../validators/commercialPackage.validator");

router.use(protect);

router.post(
    "/",
    authorize("ADMIN", "ACCOUNTS"),
    createCommercialPackageValidator,
    validate,
    controller.createCommercialPackage
);

router.get(
    "/",
    authorize("ADMIN", "ACCOUNTS"),
    controller.getAllCommercialPackages
);

router.get(
    "/active",
    authorize("ADMIN", "ACCOUNTS"),
    controller.getActiveCommercialPackages
);

router.get(
    "/:id",
    authorize("ADMIN", "ACCOUNTS"),
    commercialPackageIdValidator,
    validate,
    controller.getCommercialPackageById
);

router.patch(
    "/:id",
    authorize("ADMIN", "ACCOUNTS"),
    updateCommercialPackageValidator,
    validate,
    controller.updateCommercialPackage
);

router.delete(
    "/:id",
    authorize("ADMIN", "ACCOUNTS"),
    commercialPackageIdValidator,
    validate,
    controller.deleteCommercialPackage
);

module.exports = router;