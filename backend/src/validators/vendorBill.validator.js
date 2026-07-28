const { param } =
require("express-validator");

const createVendorBillValidator = [

    param("dutyId")
        .isMongoId()
        .withMessage("Invalid Duty ID.")

];

module.exports = {
    createVendorBillValidator,
};