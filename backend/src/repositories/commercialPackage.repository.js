const CommercialPackage =
    require("../models/commercialPackage.model");


const create = async (
    data,
    session = null
) => {

    if (session) {
        const [commercialPackage] =
            await CommercialPackage.create(
                [data],
                { session }
            );

        return commercialPackage;
    }

    return CommercialPackage.create(data);
};


const findById = async (
    id,
    session = null
) => {

    const query =
        CommercialPackage.findOne({
            _id: id,
            isDeleted: false,
        });

    if (session) {
        query.session(session);
    }

    return query;
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


const updateById = async (
    id,
    data,
    session = null
) => {

    const query =
        CommercialPackage.findOneAndUpdate(
            {
                _id: id,
                isDeleted: false,
            },
            data,
            {
                new: true,
                runValidators: true,
                ...(session
                    ? { session }
                    : {}),
            }
        );

    return query;
};


const softDelete = async (
    id,
    session = null
) => {

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
            ...(session
                ? { session }
                : {}),
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