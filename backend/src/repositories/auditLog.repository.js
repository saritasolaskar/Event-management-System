const AuditLog =
require("../models/auditLog.model");

/**
 * Create Audit Log
 */
const create = (data) =>
    AuditLog.create(data);

/**
 * Find Audit Log By ID
 */
const findById = (id) =>

    AuditLog.findById(id)
        .populate("user");

/**
 * Get All Audit Logs
 */
const findAll = () =>

    AuditLog.find()
        .populate("user")
        .sort({
            createdAt: -1,
        });

/**
 * Get Logs By User
 */
const findByUser = (userId) =>

    AuditLog.find({
        user: userId,
    })
        .sort({
            createdAt: -1,
        });

/**
 * Get Logs By Module
 */
const findByModule = (module) =>

    AuditLog.find({
        module,
    })
        .populate("user")
        .sort({
            createdAt: -1,
        });

/**
 * Get Logs Of A Record
 */
const findByReference = (
    module,
    referenceId
) =>

    AuditLog.find({

        module,

        referenceId,

    })
        .populate("user")
        .sort({
            createdAt: -1,
        });

module.exports = {

    create,

    findById,

    findAll,

    findByUser,

    findByModule,

    findByReference,

};