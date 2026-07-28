const VendorBill =
    require("../models/vendorBill.model");

const create = (data) =>
    VendorBill.create(data);

const findById = (id) =>
    VendorBill.findById(id)
        .populate("vendor")
        .populate("vehicleAssignment")
        .populate("duty");

const findAll = () =>
    VendorBill.find({
        isDeleted: false
    })
        .populate("vendor")
        .populate("vehicleAssignment")
        .populate("duty")
        .sort({
            createdAt: -1
        });

const updateById = (id, data) =>
    VendorBill.findByIdAndUpdate(
        id,
        data,
        {
            new: true,
            runValidators: true,
        }
    );

const findByVendor = async (vendorId) => {

    return VendorBill.find({
        vendor: vendorId,
        isDeleted: false,
    })
        .populate("vehicleAssignment")
        .sort({
            createdAt: -1,
        });

};

module.exports = {
    create,
    findById,
    findAll,
    updateById,
    findByVendor,
};