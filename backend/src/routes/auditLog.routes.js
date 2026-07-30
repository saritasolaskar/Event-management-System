const express = require("express");

const router = express.Router();

const controller =
require("../controllers/auditLog.controller");

const protect =
require("../middleware/auth.middleware");

const authorize =
require("../middleware/authorize.middleware");

const validate =
require("../middleware/validate");

const {
    auditLogIdValidator,
    auditLogUserValidator,
    auditLogReferenceValidator,
    auditLogModuleValidator,
} = require("../validators/auditLog.validator");

const {
    ROLES,
} = require("../constants/roles");

/*
|--------------------------------------------------------------------------
| All Audit Log Routes Require Admin/Accounts Access
|--------------------------------------------------------------------------
*/

router.use(

    protect,

    authorize(

        ROLES.ADMIN,

        ROLES.ACCOUNTS

    )

);

/*
|--------------------------------------------------------------------------
| Get All Audit Logs
|--------------------------------------------------------------------------
*/

router.get(

    "/",

    controller.getAllLogs

);

/*
|--------------------------------------------------------------------------
| Get Audit Log By ID
|--------------------------------------------------------------------------
*/

router.get(

    "/:id",

    auditLogIdValidator,

    validate,

    controller.getLogById

);

/*
|--------------------------------------------------------------------------
| Get Logs By User
|--------------------------------------------------------------------------
*/

router.get(

    "/user/:userId",

    auditLogUserValidator,

    validate,

    controller.getLogsByUser

);

/*
|--------------------------------------------------------------------------
| Get Logs By Module
|--------------------------------------------------------------------------
*/

router.get(

    "/module/:module",

    auditLogModuleValidator,

    validate,

    controller.getLogsByModule

);

/*
|--------------------------------------------------------------------------
| Get Logs By Reference
|--------------------------------------------------------------------------
*/

router.get(

    "/module/:module/:referenceId",

    auditLogReferenceValidator,

    validate,

    controller.getLogsByReference

);

module.exports = router;