const AppError = require("./appError");

class ValidationError extends AppError {
    constructor(errors) {
        super("Validation failed", 422);
        this.errors = errors;
    }
}

module.exports = ValidationError;