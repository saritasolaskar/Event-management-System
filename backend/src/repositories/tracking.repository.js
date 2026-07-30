const Tracking = require("../models/tracking.model");

/**
 * Create Tracking Record
 */
const create = (data) =>
    Tracking.create(data);

/**
 * Latest Location By Duty
 */
const findLatestByDuty = (dutyId) =>
    Tracking.findOne({
        duty: dutyId,
    })
        .sort({ recordedAt: -1 })
        .populate("driver")
        .populate("vehicleAssignment");

/**
 * Tracking History By Duty
 */
const findHistoryByDuty = (dutyId) =>
    Tracking.find({
        duty: dutyId,
    })
        .sort({ recordedAt: 1 });

/**
 * Latest Location By Driver
 */
const findLatestByDriver = (driverId) =>
    Tracking.findOne({
        driver: driverId,
    })
        .sort({ recordedAt: -1 })
        .populate("duty")
        .populate("vehicleAssignment");

/**
 * Latest Location Of Every Active Duty
 */
const findLatestActiveLocations = async () => {

    return Tracking.aggregate([
        {
            $sort: {
                recordedAt: -1,
            },
        },
        {
            $group: {
                _id: "$duty",
                latestTracking: {
                    $first: "$$ROOT",
                },
            },
        },
        {
            $replaceRoot: {
                newRoot: "$latestTracking",
            },
        },
    ]);

};

module.exports = {
    create,
    findLatestByDuty,
    findHistoryByDuty,
    findLatestByDriver,
    findLatestActiveLocations,
};