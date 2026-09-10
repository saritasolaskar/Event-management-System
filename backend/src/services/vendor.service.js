// vecdor services
const vendorRepository =
    require("../repositories/vendor.repository");
const mongoose = require("mongoose");

const AppError =
    require("../utils/AppError");

const { STATUS } =
    require("../constants/status");
const vehicleRepository =
    require("../repositories/vehicle.repository");

const driverRepository =
    require("../repositories/driver.repository");
/**
 * Fields allowed when creating a Vendor.
 */
const CREATE_FIELDS = [
    "companyName",
    "ownerName",
    "email",
    "phone",
    "gstNumber",
    "panNumber",
    "paymentCycle",
    "commissionType",
    "commissionValue",
];

/**
 * Fields allowed when updating a Vendor.
 */
const UPDATE_FIELDS = [
    "companyName",
    "ownerName",
    "email",
    "phone",
    "gstNumber",
    "panNumber",
    "paymentCycle",
    "commissionType",
    "commissionValue",
];

/**
 * Pick only allowed fields.
 */
const pickFields = (
    data,
    fields
) => {
    const result = {};

    for (const field of fields) {
        if (
            Object.prototype.hasOwnProperty.call(
                data,
                field
            )
        ) {
            result[field] = data[field];
        }
    }

    return result;
};

/**
 * Create Vendor
 */
const createVendor = async (
    vendorData,
    userId
) => {

    const data = pickFields(
        vendorData,
        CREATE_FIELDS
    );

    const existingCompany =
        await vendorRepository.findByCompanyName(
            data.companyName
        );

    if (existingCompany) {
        throw new AppError(
            "Vendor company already exists.",
            409
        );
    }

    const existingEmail =
        await vendorRepository.findByEmail(
            data.email
        );

    if (existingEmail) {
        throw new AppError(
            "Vendor email already exists.",
            409
        );
    }

    if (data.gstNumber) {
        const existingGST =
            await vendorRepository.findByGST(
                data.gstNumber
            );

        if (existingGST) {
            throw new AppError(
                "Vendor GST already exists.",
                409
            );
        }
    }

    const vendor = {
        ...data,

        // System-controlled fields
        status: STATUS.ACTIVE,

        createdBy: userId,
        updatedBy: userId,

        isDeleted: false,
        deletedAt: null,
    };

    return vendorRepository.create(vendor);
};

/**
 * Get All Vendors
 */
const getAllVendors = async () => {
    return vendorRepository.findAll();
};

/**
 * Get Vendor By ID
 */
const getVendorById = async (
    vendorId
) => {

    const vendor =
        await vendorRepository.findById(
            vendorId
        );

    if (!vendor) {
        throw new AppError(
            "Vendor not found.",
            404
        );
    }

    return vendor;
};

/**
 * Update Vendor
 */
const updateVendor = async (
    vendorId,
    updateData,
    userId
) => {

    const vendor =
        await vendorRepository.findById(
            vendorId
        );

    if (!vendor) {
        throw new AppError(
            "Vendor not found.",
            404
        );
    }

    const data = pickFields(
        updateData,
        UPDATE_FIELDS
    );

    if (Object.keys(data).length === 0) {
        throw new AppError(
            "No valid fields provided for update.",
            400
        );
    }

    if (
        data.companyName &&
        data.companyName !==
            vendor.companyName
    ) {

        const existingCompany =
            await vendorRepository.findByCompanyName(
                data.companyName
            );

        if (existingCompany) {
            throw new AppError(
                "Vendor company already exists.",
                409
            );
        }
    }

    if (
        data.email &&
        data.email !== vendor.email
    ) {

        const existingEmail =
            await vendorRepository.findByEmail(
                data.email
            );

        if (existingEmail) {
            throw new AppError(
                "Vendor email already exists.",
                409
            );
        }
    }

    if (
        data.gstNumber &&
        data.gstNumber !== vendor.gstNumber
    ) {

        const existingGST =
            await vendorRepository.findByGST(
                data.gstNumber
            );

        if (existingGST) {
            throw new AppError(
                "Vendor GST already exists.",
                409
            );
        }
    }

    data.updatedBy = userId;

    return vendorRepository.updateById(
        vendorId,
        data
    );
};

/**
 * Delete Vendor
 */
const deleteVendor = async (
    vendorId
) => {

    const session =
        await mongoose.startSession();

    try {

        let deleted;

        await session.withTransaction(
            async () => {

                const vendor =
                    await vendorRepository.findById(
                        vendorId,
                        session
                    );

                if (!vendor) {
                    throw new AppError(
                        "Vendor not found.",
                        404
                    );
                }

                /*
                 * Prevent deletion if active vehicles
                 * still reference this vendor.
                 */
                const activeVehicles =
                    await vehicleRepository.findByVendor(
                        vendorId,
                        session
                    );

                if (
                    activeVehicles &&
                    activeVehicles.length > 0
                ) {
                    throw new AppError(
                        "Cannot delete vendor. Active vehicles are still assigned to this vendor.",
                        409
                    );
                }

                /*
                 * Prevent deletion if active drivers
                 * still reference this vendor.
                 */
                const activeDrivers =
                    await driverRepository.findByVendor(
                        vendorId,
                        session
                    );

                if (
                    activeDrivers &&
                    activeDrivers.length > 0
                ) {
                    throw new AppError(
                        "Cannot delete vendor. Active drivers are still assigned to this vendor.",
                        409
                    );
                }

                deleted =
                    await vendorRepository.softDelete(
                        vendorId,
                        session
                    );

                if (!deleted) {
                    throw new AppError(
                        "Vendor could not be deleted.",
                        500
                    );
                }
            }
        );

        return {
            message:
                "Vendor deleted successfully.",
        };

    } finally {

        await session.endSession();

    }
};

/**
 * Update Vendor Status
 */
const updateVendorStatus = async (
    vendorId,
    status,
    userId
) => {

    const vendor =
        await vendorRepository.findById(
            vendorId
        );

    if (!vendor) {
        throw new AppError(
            "Vendor not found.",
            404
        );
    }

    if (
        !Object.values(STATUS).includes(
            status
        )
    ) {
        throw new AppError(
            "Invalid vendor status.",
            400
        );
    }

    return vendorRepository.updateStatus(
        vendorId,
        status,
        userId
    );
};

module.exports = {
    createVendor,
    getAllVendors,
    getVendorById,
    updateVendor,
    deleteVendor,
    updateVendorStatus,
};