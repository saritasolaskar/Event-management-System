const { param } = require("express-validator");

const createClientInvoiceValidator = [
    param("dutyId")
        .isMongoId()
        .withMessage("Invalid Duty ID."),
];

module.exports = {
    createClientInvoiceValidator,
};