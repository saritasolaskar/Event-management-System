const AppError = require("../utils/AppError");

/**
 * Authorize user based on roles
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Ensure user is authenticated
    if (!req.user) {
      return next(
        new AppError("Authentication required.", 401)
      );
    }

    // Check role
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          "You do not have permission to perform this action.",
          403
        )
      );
    }

    next();
  };
};

module.exports = authorize;