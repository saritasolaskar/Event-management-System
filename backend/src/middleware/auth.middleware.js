const AppError = require("../utils/appError");

const { verifyAccessToken } = require("../utils/jwt.utils");

const userRepository = require("../repositories/user.repository");
const asyncHandler = require("../utils/asyncHandler");

const protect = asyncHandler(async (req, res, next) =>  {
  try {
    let token;

    // Check Authorization Header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // No Token
    if (!token) {
      return next(
        new AppError(
          "Access denied. No token provided.",
          401
        )
      );
    }

    // Verify Token
    const payload = verifyAccessToken(token);

    // Find User
    const user = await userRepository.findById(payload.id);

    if (!user) {
      return next(
        new AppError(
          "User no longer exists.",
          401
        )
      );
    }

    // Check Active Status
    if (user.status !== "ACTIVE") {
      return next(
        new AppError(
          "Account is inactive.",
          403
        )
      );
    }

    // Attach User
    req.user = user;

    next();

  } catch (error) {
    next(error);
  }
});

module.exports = protect;