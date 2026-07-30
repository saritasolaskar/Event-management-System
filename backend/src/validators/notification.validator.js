const { param } = require("express-validator");

const notificationIdValidator = [

    param("id")
        .isMongoId()
        .withMessage("Invalid Notification ID."),

];

module.exports = {

    notificationIdValidator,

};