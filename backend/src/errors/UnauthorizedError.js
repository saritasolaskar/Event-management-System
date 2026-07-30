const AppError = require("./appError");

class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

module.exports = UnauthorizedError;