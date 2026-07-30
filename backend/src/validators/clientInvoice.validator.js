const { param } = require("express-validator");

/**
 * Create Client Invoice
 */
const createClientInvoiceValidator = [

    param("dutyId")
        .isMongoId()
        .withMessage("Invalid Duty ID."),

];

/**
 * Client Invoice ID
 */
const clientInvoiceIdValidator = [

    param("invoiceId")
        .isMongoId()
        .withMessage("Invalid Client Invoice ID."),

];

module.exports = {

    createClientInvoiceValidator,

    clientInvoiceIdValidator,

};