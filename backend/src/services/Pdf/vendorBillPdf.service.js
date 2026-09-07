const vendorBillRepository =
    require("../../repositories/vendorBill.repository");

const pdfGenerator =
    require("../pdfGenerator");

const AppError =
    require("../../utils/AppError");

const COMPANY = {
    name: "Transit Fleets",
    address:
        process.env.COMPANY_ADDRESS ||
        "Your Company Address",
    phone:
        process.env.COMPANY_PHONE ||
        "Your Phone",
    email:
        process.env.COMPANY_EMAIL ||
        "info@transitfleets.com",
    gst:
        process.env.COMPANY_GST ||
        "",
};

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

    const data = {

        company: COMPANY,

        bill: {
            ...bill.toObject(),

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

        duty:
            bill.duty,

        event:
            bill.duty.event,

        vehicle:
            bill.vehicleAssignment.vehicle,

        driver:
            bill.vehicleAssignment.driver,

        package: {
            name:
                bill.packageName || "",
            km:
                bill.packageKm || 0,
            hours:
                bill.packageHours || 0,
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