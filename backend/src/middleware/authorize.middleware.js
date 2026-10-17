const AppError = require("../utils/AppError");

const ADMINISTRATIVE_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OPERATIONS_MANAGER",
  "DISPATCHER",
  "ACCOUNTS",
  "SUPPORT",
];

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

    // SUPER_ADMIN inherits administrative access only.
    const superAdminHasAdministrativeAccess =
      req.user.role === "SUPER_ADMIN" &&
      allowedRoles.some((role) => ADMINISTRATIVE_ROLES.includes(role));

    // Check role
    if (
      !allowedRoles.includes(req.user.role) &&
      !superAdminHasAdministrativeAccess
    ) {
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