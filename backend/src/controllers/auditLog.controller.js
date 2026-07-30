const auditLogService =
require("../services/auditLog.service");

const asyncHandler =
require("../utils/asyncHandler");

const {
    successResponse,
} = require("../utils/response.utils");

/**
 * Get All Audit Logs
 */
const getAllLogs =
asyncHandler(async (req, res) => {

    const logs =
    await auditLogService.getAllLogs();

    return successResponse(

        res,

        200,

        "Audit logs fetched successfully.",

        logs

    );

});

/**
 * Get Audit Log By ID
 */
const getLogById =
asyncHandler(async (req, res) => {

    const log =
    await auditLogService.getLogById(

        req.params.id

    );

    return successResponse(

        res,

        200,

        "Audit log fetched successfully.",

        log

    );

});

/**
 * Get Logs By User
 */
const getLogsByUser =
asyncHandler(async (req, res) => {

    const logs =
    await auditLogService.getLogsByUser(

        req.params.userId

    );

    return successResponse(

        res,

        200,

        "User audit logs fetched successfully.",

        logs

    );

});

/**
 * Get Logs By Module
 */
const getLogsByModule =
asyncHandler(async (req, res) => {

    const logs =
    await auditLogService.getLogsByModule(

        req.params.module

    );

    return successResponse(

        res,

        200,

        "Module audit logs fetched successfully.",

        logs

    );

});

/**
 * Get Logs By Reference
 */
const getLogsByReference =
asyncHandler(async (req, res) => {

    const logs =
    await auditLogService.getLogsByReference(

        req.params.module,

        req.params.referenceId

    );

    return successResponse(

        res,

        200,

        "Record audit logs fetched successfully.",

        logs

    );

});

module.exports = {

    getAllLogs,

    getLogById,

    getLogsByUser,

    getLogsByModule,

    getLogsByReference,

};