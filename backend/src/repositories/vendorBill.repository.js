const VendorBill =
    require("../models/vendorBill.model");

/**
 * Create Vendor Bill
 */
const create = async (data) => {

    return VendorBill.create(data);

};

/**
 * Get Vendor Bill By ID
 */
const findById = async (id) => {

    return VendorBill.findOne({
        _id: id,
        isDeleted: false,
    })
        .populate("vendor")
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
        .populate({
            path: "duty",
            populate: {
                path: "event",
                populate: {
                    path: "venue",
                },
            },
        })
        .populate("approvedBy");

};

/**
 * Get All Vendor Bills
 */
const findAll = async () => {

    return VendorBill.find({
        isDeleted: false,
    })
        .populate("vendor")
        .populate("vehicleAssignment")
        .populate("duty")
        .sort({
            createdAt: -1,
        });

};

/**
 * Update Vendor Bill
 */
const updateById = async (
    id,
    data
) => {

    return VendorBill.findOneAndUpdate(
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

/**
 * Get Vendor Bills By Vendor
 */
const findByVendor = async (
    vendorId
) => {

    return VendorBill.find({
        vendor: vendorId,
        isDeleted: false,
    })
        .populate("vehicleAssignment")
        .sort({
            createdAt: -1,
        });

};

/**
 * Get Vendor Bill By Duty
 */
const findByDuty = async (
    dutyId
) => {

    return VendorBill.findOne({
        duty: dutyId,
        isDeleted: false,
    });

};

module.exports = {
    create,
    findById,
    findAll,
    updateById,
    findByVendor,
    findByDuty,
};