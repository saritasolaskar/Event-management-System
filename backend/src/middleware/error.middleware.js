const AppError = require("../utils/appError");

const errorMiddleware = (err, req, res, next) => {

    let error = err;

    // Convert unknown errors into AppError
    if (!(error instanceof AppError)) {
        error = new AppError(
            error.message || "Internal Server Error",
            error.statusCode || 500
        );
    }

    // Log errors during development
    if (process.env.NODE_ENV !== "production") {
        console.error(error);
    }

    // Send response
    return res.status(error.statusCode).json({
        success: false,
        status: error.status,
        message: error.message,
        errors: error.errors || undefined,
        ...(process.env.NODE_ENV !== "production" && {
            stack: error.stack,
        }),
    });

};

module.exports = errorMiddleware;