const express = require("express");

const router = express.Router();

const protect =
    require("../middleware/auth.middleware");

const authorize =
    require("../middleware/role.middleware");

const controller =
    require("../controllers/commercialPackage.controller");

router.use(protect);

router.post(
    "/",
    authorize("ADMIN", "ACCOUNTS"),
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
    controller.getCommercialPackageById
);

router.patch(
    "/:id",
    authorize("ADMIN", "ACCOUNTS"),
    controller.updateCommercialPackage
);

router.delete(
    "/:id",
    authorize("ADMIN", "ACCOUNTS"),
    controller.deleteCommercialPackage
);

module.exports = router;