const auditLogRepository =
require("../repositories/auditLog.repository");

const AppError =
require("../utils/AppError");

/**
 * Create Audit Log
 */
const createLog = async ({

    user,

    action,

    module,

    referenceId,

    description,

    ipAddress = null,

    userAgent = null,

    metadata = {},

}) => {

    return auditLogRepository.create({

        user,

        action,

        module,

        referenceId,

        description,

        ipAddress,

        userAgent,

        metadata,

    });

};

/**
 * Get All Audit Logs
 */
const getAllLogs = async () => {

    return auditLogRepository.findAll();

};

/**
 * Get Audit Log By ID
 */
const getLogById = async (id) => {

    const log =
    await auditLogRepository.findById(id);

    if (!log) {

        throw new AppError(

            "Audit log not found.",

            404

        );

    }

    return log;

};

/**
 * Get Logs By User
 */
const getLogsByUser = async (userId) => {

    return auditLogRepository.findByUser(
        userId
    );

};

/**
 * Get Logs By Module
 */
const getLogsByModule = async (module) => {

    return auditLogRepository.findByModule(
        module
    );

};

/**
 * Get Logs Of A Specific Record
 */
const getLogsByReference = async (

    module,

    referenceId

) => {

    return auditLogRepository.findByReference(

        module,

        referenceId

    );

};

module.exports = {

    createLog,

    getAllLogs,

    getLogById,

    getLogsByUser,

    getLogsByModule,

    getLogsByReference,

};