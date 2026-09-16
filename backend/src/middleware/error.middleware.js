const AppError = require("../utils/AppError");

const errorMiddleware = (err, req, res, next) => {
    let error = err;

    if (error.code === 11000) {
        error = new AppError(
            "A record with one of these unique fields already exists.",
            409
        );
    }

    if (!(error instanceof AppError)) {
        error = new AppError(
            error.message || "Internal Server Error",
            error.statusCode || 500
        );
    }

    if (process.env.NODE_ENV !== "production") {
        console.error(error);
    }

    return res.status(error.statusCode).json({
        success: false,
        status: error.status,
        message:
            process.env.NODE_ENV === "production" &&
            error.statusCode >= 500
                ? "Internal Server Error"
                : error.message,
        errors: error.errors || undefined,
        ...(process.env.NODE_ENV !== "production" && {
            stack: error.stack,
        }),
    });
};

module.exports = errorMiddleware;