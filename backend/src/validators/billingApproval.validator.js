const {
    param,
    body,
} = require("express-validator");


const billingApprovalIdValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid ID."),

];


const approvalRemarksValidator = [

    ...billingApprovalIdValidator,

    body("remarks")
        .optional()
        .isString()
        .withMessage("Remarks must be a string.")
        .trim(),

];


const paymentValidator = [

    ...billingApprovalIdValidator,

    body("paymentMode")
        .isIn([
            "CASH",
            "CHEQUE",
            "UPI",
            "NEFT",
            "RTGS",
        ])
        .withMessage("Invalid payment mode."),

    body("paymentReference")
        .optional()
        .isString()
        .withMessage("Payment reference must be a string.")
        .trim(),

];


module.exports = {
    billingApprovalIdValidator,
    approvalRemarksValidator,
    paymentValidator,
};