const Duty = require("../models/duty.model");
const VehicleAssignment = require("../models/vehicleAssignment.model");


const findById = (
    id,
    session = null
) => {

    const query =
        Duty.findOne({
            _id: id,
            isDeleted: false,
        }).populate({
            path: "vehicleAssignment",
            populate: [
                {
                    path: "driver",
                },
                {
                    path: "vehicle",
                },
                {
                    path: "vendor",
                },
                {
                    path: "event",
                    populate: [
                        {
                            path: "client",
                        },
                        {
                            path: "venue",
                        },
                    ],
                },
            ],
        });

    if (session) {
        query.session(session);
    }

    return query;
};


const findByVehicleAssignment = (
    assignmentId,
    session = null
) => {

    const query =
        Duty.findOne({
            vehicleAssignment:
                assignmentId,

            isDeleted:
                false,
        });

    if (session) {
        query.session(session);
    }

    return query;
};


const findActiveDutyByDriver = async (
    driverId,
    session = null
) => {

    const assignmentQuery =
        VehicleAssignment.findOne({
            driver:
                driverId,

            isDeleted:
                false,

            status:
                "ON_DUTY",
        });

    if (session) {
        assignmentQuery.session(session);
    }

    const activeAssignment =
        await assignmentQuery;

    if (!activeAssignment) {
        return null;
    }

    const dutyQuery =
        Duty.findOne({
            vehicleAssignment:
                activeAssignment._id,

            status:
                "STARTED",

            isDeleted:
                false,
        }).populate({
            path: "vehicleAssignment",
            populate: [
                {
                    path: "driver",
                },
                {
                    path: "vehicle",
                },
                {
                    path: "vendor",
                },
                {
                    path: "event",
                },
            ],
        });

    if (session) {
        dutyQuery.session(session);
    }

    return dutyQuery;
};


const create = (
    data,
    session = null
) => {

    return Duty.create(
        [data],
        session
            ? { session }
            : {}
    ).then(
        (docs) => docs[0]
    );
};


const updateById = (
    id,
    data,
    session = null
) => {

    return Duty.findOneAndUpdate(
        {
            _id:
                id,

            isDeleted:
                false,
        },

        data,

        {
            new:
                true,

            runValidators:
                true,

            ...(session
                ? { session }
                : {}),
        }
    );
};


const updateByIdAndStatus = (
    id,
    currentStatus,
    data,
    session = null
) => {

    return Duty.findOneAndUpdate(
        {
            _id:
                id,

            status:
                currentStatus,

            isDeleted:
                false,
        },

        data,

        {
            new:
                true,

            runValidators:
                true,

            ...(session
                ? { session }
                : {}),
        }
    );
};


module.exports = {
    create,
    findById,
    findByVehicleAssignment,
    updateById,
    findActiveDutyByDriver,
    updateByIdAndStatus,
};