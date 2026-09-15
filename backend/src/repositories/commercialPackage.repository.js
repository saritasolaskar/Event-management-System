const CommercialPackage = require("../models/commercialPackage.model");

const create = async (data) => {
    return CommercialPackage.create(data);
};

const findById = async (id) => {
    return CommercialPackage.findOne({
        _id: id,
        isDeleted: false,
    });
};

const findAll = async () => {
    return CommercialPackage.find({
        isDeleted: false,
    }).sort({
        createdAt: -1,
    });
};

const findActive = async () => {
    return CommercialPackage.find({
        isDeleted: false,
        isActive: true,
    }).sort({
        name: 1,
    });
};

const updateById = async (id, data) => {
    return CommercialPackage.findOneAndUpdate(
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
};

const softDelete = async (id) => {
    return CommercialPackage.findOneAndUpdate(
        {
            _id: id,
            isDeleted: false,
        },
        {
            isDeleted: true,
            isActive: false,
        },
        {
            new: true,
        }
    );
};

module.exports = {
    create,
    findById,
    findAll,
    findActive,
    updateById,
    softDelete,
};