const ClientInvoice = require("../models/clientInvoice.model");

const create = (data) =>
    ClientInvoice.create(data);

const findById = (id) =>
    ClientInvoice.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate("client")

        .populate({
            path: "event",
            populate: {
                path: "venue",
            },
        })

        .populate({
            path: "vehicleAssignment",
            populate: [
                {
                    path: "driver",
                },
                {
                    path: "vehicle",
                },
            ],
        })

        .populate("duty");

const findAll = () =>
    ClientInvoice.find({
        isDeleted: false
    })
        .populate("client")
        .populate("event")
        .populate("vehicleAssignment")
        .sort({
            createdAt: -1
        });

const updateById = (id, data) =>
    ClientInvoice.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        data,
        {
            new: true,
            runValidators: true,
        }
    );

const findByClient = async (clientId) => {

    return ClientInvoice.find({
        client: clientId,
        isDeleted: false,
    })
        .populate("event")
        .sort({
            createdAt: -1,
        });

};

const findByDuty = (dutyId) =>
    ClientInvoice.findOne({
        duty: dutyId,
        isDeleted: false,
    });

    
module.exports = {
    create,
    findById,
    findAll,
    updateById,
    findByClient,
    findByDuty,
};