const DriverTracking = require("../models/driverTracking.model");

/**
 * Create Tracking Point
 */
const create = async (trackingData) => {

    return DriverTracking.create(trackingData);

};

/**
 * Get Latest Tracking By Duty
 */
const findLatestByDuty = async (dutyId) => {

    return DriverTracking.findOne({
        duty: dutyId,
    })
    .sort({
        trackedAt: -1,
    });

};

/**
 * Get Tracking History
 */
const findHistoryByDuty = async (dutyId) => {

    return DriverTracking.find({
        duty: dutyId,
    })
    .sort({
        trackedAt: 1,
    });

};

/**
 * Delete Tracking History
 */
const deleteByDuty = async (dutyId) => {

    return DriverTracking.deleteMany({
        duty: dutyId,
    });

};

module.exports = {

    create,

    findLatestByDuty,

    findHistoryByDuty,

    deleteByDuty,

};