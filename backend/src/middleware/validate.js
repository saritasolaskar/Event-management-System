const { validationResult } = require("express-validator");

const ValidationError = require("../errors/ValidationError");
const validate = (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return next(
            new ValidationError(
                errors.array().map((err) => ({
                    field: err.path,
                    message: err.msg,
                }))
            )
        );
    }

    next();

};

module.exports = validate;