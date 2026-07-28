const VehicleAssignment = require("../models/vehicleAssignment.model");

const create = async (data) => {
  return VehicleAssignment.create(data);
};

const findById = async (id) => {
  return VehicleAssignment.findOne({
    _id: id,
    isDeleted: false,
  })
    .populate("event")
    .populate("vendor")
    .populate("driver")
    .populate("vehicle")
    .populate("reportingLocation");
};

const findAll = async () => {
  return VehicleAssignment.find({
    isDeleted: false,
  })
    .populate("event", "eventCode name")
    .populate("vendor", "vendorCode companyName")
    .populate("driver", "firstName lastName phone")
    .populate("vehicle", "registrationNumber vehicleType")
    .sort({ createdAt: -1 });
};

const updateById = async (id, data) => {
  return VehicleAssignment.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const softDelete = async (id) => {
  return VehicleAssignment.findByIdAndUpdate(
    id,
    {
      isDeleted: true,
    },
    {
      new: true,
    }
  );
};

const findTodayByDriver = async (driverId) => {

    return VehicleAssignment.findOne({
        driver: driverId,
        isDeleted: false,
    })
        .populate("vehicle")
        .populate("event")
        .populate("vendor");

};

const findByEvent = async (eventId) => {

    return VehicleAssignment.find({
        event: eventId,
        isDeleted: false,
    })
    .populate("driver")
    .populate("vehicle")
    .populate("vendor")
    .sort({
        createdAt: 1,
    });

};

module.exports = {
  create,
 findById,
  findAll,
  updateById,
  softDelete,
    findTodayByDriver,
    findByEvent,
};