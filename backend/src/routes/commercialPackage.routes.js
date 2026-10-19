
const express = require("express");

const router = express.Router();

const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const controller = require("../controllers/commercialPackage.controller");

const {
    commercialPackageIdValidator,
    createCommercialPackageValidator,
    updateCommercialPackageValidator,
} = require("../validators/commercialPackage.validator");

const PACKAGE_MANAGE_ROLES = [
    ROLES.SUPER_ADMIN,
    ROLES.ADMIN,
    ROLES.ACCOUNTS,
];

const PACKAGE_READ_ROLES = [
    ...PACKAGE_MANAGE_ROLES,
    ROLES.OPERATIONS_MANAGER,
];

router.use(protect);

// Create a commercial package.
router.post(
    "/",
    authorize(...PACKAGE_MANAGE_ROLES),
    createCommercialPackageValidator,
    validate,
    controller.createCommercialPackage
);

// Get all commercial packages.
router.get(
    "/",
    authorize(...PACKAGE_READ_ROLES),
    controller.getAllCommercialPackages
);

// Get active packages for vehicle assignments.
router.get(
    "/active",
    authorize(...PACKAGE_READ_ROLES),
    controller.getActiveCommercialPackages
);

// Get one commercial package.
router.get(
    "/:id",
    authorize(...PACKAGE_READ_ROLES),
    commercialPackageIdValidator,
    validate,
    controller.getCommercialPackageById
);

// Update a commercial package.
router.patch(
    "/:id",
    authorize(...PACKAGE_MANAGE_ROLES),
    updateCommercialPackageValidator,
    validate,
    controller.updateCommercialPackage
);

// Delete a commercial package.
router.delete(
    "/:id",
    authorize(...PACKAGE_MANAGE_ROLES),
    commercialPackageIdValidator,
    validate,
    controller.deleteCommercialPackage
);

module.exports = router;
