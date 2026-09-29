const AppError =
    require("../utils/AppError");

const {
    verifyAccessToken,
} = require("../utils/jwt.utils");

const {
    STATUS,
} = require("../constants/status");

const userRepository =
    require("../repositories/user.repository");

const asyncHandler =
    require("../utils/asyncHandler");

const protect =
    asyncHandler(async (
        req,
        res,
        next
    ) => {

        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith(
                "Bearer "
            )
        ) {
            token =
                req.headers.authorization
                    .split(" ")[1];
        }

        if (!token) {
            return next(
                new AppError(
                    "Access denied. No token provided.",
                    401
                )
            );
        }

        const payload =
            verifyAccessToken(token);

        const user =
            await userRepository.findById(
                payload.id
            );

        if (!user) {
            return next(
                new AppError(
                    "User no longer exists.",
                    401
                )
            );
        }

        if (
            user.status !==
            STATUS.ACTIVE
        ) {
            return next(
                new AppError(
                    "Account is inactive.",
                    403
                )
            );
        }

        req.user = user;

        next();
    });

module.exports = protect;