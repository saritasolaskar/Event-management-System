
const vendorBillRepository =
    require("../../repositories/vendorBill.repository");

const pdfGenerator =
    require("../pdfGenerator");

const config =
    require("../../config/env");

const AppError =
    require("../../utils/AppError");


const generateVendorBillPdf = async (
    billId
) => {

    const bill =
        await vendorBillRepository.findById(
            billId
        );

    if (!bill) {
        throw new AppError(
            "Vendor Bill not found.",
            404
        );
    }

    if (!bill.vendor) {
        throw new AppError(
            "Vendor not found.",
            404
        );
    }

    if (!bill.duty) {
        throw new AppError(
            "Duty not found.",
            404
        );
    }

    if (!bill.vehicleAssignment) {
        throw new AppError(
            "Vehicle Assignment not found.",
            404
        );
    }

    const driver =
        bill.vehicleAssignment.driver;

    const driverData =
        driver
            ? {
                ...(
                    driver.toObject
                        ? driver.toObject()
                        : driver
                ),

                name:
                    `${driver.firstName || ""} ${
                        driver.lastName || ""
                    }`.trim(),

                phone:
                    driver.phone || "",
            }
            : null;

    const duty = {

        ...(
            bill.duty.toObject
                ? bill.duty.toObject()
                : bill.duty
        ),

        dutyDateFormatted:
            bill.duty.dutyStartTime
                ? bill.duty.dutyStartTime.toLocaleDateString()
                : "",
    };

    const company = {

        name:
            config.COMPANY_NAME ||
            "Transit Fleets",

        address:
            config.COMPANY_ADDRESS ||
            "",

        phone:
            config.COMPANY_PHONE ||
            "",

        email:
            config.COMPANY_EMAIL ||
            "",

        gst:
            config.COMPANY_GST ||
            "",

        pan:
            config.COMPANY_PAN ||
            "",

        website:
            config.COMPANY_WEBSITE ||
            "",

    };

    const data = {

        company,

        bill: {

            ...(
                bill.toObject
                    ? bill.toObject()
                    : bill
            ),

            billNumber:
                bill.billNumber ||
                `VB-${bill._id}`,

            billDate:
                bill.billDate
                    ? bill.billDate.toLocaleDateString()
                    : "",

            approvedAtFormatted:
                bill.approvedAt
                    ? bill.approvedAt.toLocaleString()
                    : "",
        },

        vendor:
            bill.vendor,

        duty,

        event:
            bill.duty.vehicleAssignment?.event ||
            bill.duty.event,

        vehicle:
            bill.vehicleAssignment.vehicle,

        driver:
            driverData,

        package: {

            name:
                bill.packageName ||
                "",

            km:
                bill.packageKm ||
                0,

            hours:
                bill.packageHours ||
                0,
        },

        approvedBy:
            bill.approvedBy,

        generatedAt:
            new Date().toLocaleString(),
    };

    return pdfGenerator.generatePdf(
        "vendorBill",
        data
    );
};

module.exports = {
    generateVendorBillPdf,
};
