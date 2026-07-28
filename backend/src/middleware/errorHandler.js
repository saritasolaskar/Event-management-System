const AppError = require("../errors/AppError");

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof AppError)) {
    error = new AppError(
      error.message || "Internal Server Error",
      error.statusCode || 500
    );
  }

  if (process.env.NODE_ENV === "development") {
    return res.status(error.statusCode).json({
      success: false,
      status: error.status,
      message: error.message,
      stack: error.stack,
    });
  }

  return res.status(error.statusCode).json({
  success: false,
  status: error.status,
  message: error.message,
  errors: error.errors || undefined,
});
};

module.exports = errorHandler;