const dutyRepository =
require("../../repositories/duty.repository");

const guestAssignmentRepository =
require("../../repositories/guestAssignment.repository");

const pdfGenerator =
require("./pdfGenerator");

const generateDutySheetPdf = async (dutyId) => {

    const duty =
        await dutyRepository.findById(dutyId);

    if (!duty) {
        throw new Error("Duty not found.");
    }

    const guestAssignments =
        await guestAssignmentRepository
            .findByVehicleAssignment(
                duty.vehicleAssignment._id
            );

    const guests =
        guestAssignments.map(item => {

            return {

                name: item.guest.name,

                phone: item.guest.phone,

                pickupAddress:
                    item.guest.pickupAddress,

                dropAddress:
                    item.guest.dropAddress,

            };

        });

    const data = {

        company: {

            name: "Transit Fleets",

            address: "Your Company Address",

            phone: "Your Phone",

            email: "info@transitfleets.com",

        },

        duty,

        event:
            duty.event,

        client:
            duty.event.client,

        vendor:
            duty.vehicleAssignment.vendor,

        vehicle:
            duty.vehicleAssignment.vehicle,

        driver:
            duty.vehicleAssignment.driver,

        guests,

        contacts: {

            operations:
                "Operations Team",

            clientSpoc:
                duty.event.client.companyName,

            emergency:
                "+91-XXXXXXXXXX",

        },

    };

    return pdfGenerator.generatePdf(
        "dutySheet",
        data
    );

};

module.exports = {
    generateDutySheetPdf,
};