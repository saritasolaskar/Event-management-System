const crypto = require("crypto");

const User =
    require("../models/user.model");


/**
 * Hash refresh token before storing/searching it.
 *
 * Refresh tokens are secrets and should never be stored
 * in plaintext inside the database.
 */
const hashRefreshToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};


/**
 * Create a new user
 */
const create = async (userData) => {
    return User.create(userData);
};


/**
 * Find user by ID
 */
const findById = async (userId) => {
    return User.findOne({
        _id: userId,
        isDeleted: false,
    });
};


/**
 * Find user by email
 */
const findByEmail = async (email) => {
    return User.findOne({
        email,
        isDeleted: false,
    });
};


/**
 * Find user by email with password
 */
const findByEmailWithPassword = async (email) => {
    return User.findOne({
        email,
        isDeleted: false,
    }).select("+password");
};


/**
 * Find user by phone
 */
const findByPhone = async (phone) => {
    return User.findOne({
        phone,
        isDeleted: false,
    });
};


/**
 * Update user
 *
 * Never update a soft-deleted user.
 */
const updateById = async (
    userId,
    updateData
) => {
    return User.findOneAndUpdate(
        {
            _id: userId,
            isDeleted: false,
        },
        updateData,
        {
            new: true,
            runValidators: true,
        }
    );
};


/**
 * Update Last Login
 */
const updateLastLogin = async (userId) => {
    return User.findOneAndUpdate(
        {
            _id: userId,
            isDeleted: false,
        },
        {
            lastLogin: new Date(),
        },
        {
            new: true,
            runValidators: true,
        }
    );
};


/**
 * Soft Delete User
 */
const softDelete = async (userId) => {
    return User.findOneAndUpdate(
        {
            _id: userId,
            isDeleted: false,
        },
        {
            isDeleted: true,
            deletedAt: new Date(),
            refreshTokens: [],
        },
        {
            new: true,
            runValidators: true,
        }
    );
};


/**
 * Add Refresh Token
 *
 * Only the SHA-256 hash is stored.
 */
const addRefreshToken = async (
    userId,
    refreshToken,
    expiresAt,
    device = "Unknown Device",
    ipAddress = null,
    userAgent = null
) => {

    const hashedToken =
        hashRefreshToken(refreshToken);

    return User.findOneAndUpdate(
        {
            _id: userId,
            isDeleted: false,
        },
        {
            $push: {
                refreshTokens: {
                    token: hashedToken,
                    expiresAt,
                    device,
                    ipAddress,
                    userAgent,
                },
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );
};


/**
 * Find User By Refresh Token
 */
const findByRefreshToken = async (
    refreshToken
) => {

    const hashedToken =
        hashRefreshToken(refreshToken);

    return User.findOne({
        isDeleted: false,
        "refreshTokens.token": hashedToken,
    });
};


/**
 * Remove Refresh Token
 */
const removeRefreshToken = async (
    userId,
    refreshToken
) => {

    const hashedToken =
        hashRefreshToken(refreshToken);

    return User.findOneAndUpdate(
        {
            _id: userId,
            isDeleted: false,
        },
        {
            $pull: {
                refreshTokens: {
                    token: hashedToken,
                },
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );
};


/**
 * Remove All Refresh Tokens
 */
const removeAllRefreshTokens = async (
    userId
) => {

    return User.findOneAndUpdate(
        {
            _id: userId,
            isDeleted: false,
        },
        {
            $set: {
                refreshTokens: [],
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );
};


/**
 * Find user by password reset token
 */
const findByPasswordResetToken = async (
    token
) => {

    return User.findOne({
        passwordResetToken: token,
        isDeleted: false,
    }).select("+password");
};


/**
 * Record failed login attempt.
 *
 * Lock account for 15 minutes after
 * 5 consecutive failed attempts.
 */
const recordFailedLoginAttempt = async (
    userId
) => {

    const MAX_ATTEMPTS = 5;

    const LOCK_DURATION_MS =
        15 * 60 * 1000;

    const user =
        await User.findOneAndUpdate(
            {
                _id: userId,
                isDeleted: false,
            },
            [
                {
                    $set: {
                        failedLoginAttempts: {
                            $add: [
                                "$failedLoginAttempts",
                                1,
                            ],
                        },
                    },
                },
                {
                    $set: {
                        lockUntil: {
                            $cond: [
                                {
                                    $gte: [
                                        "$failedLoginAttempts",
                                        MAX_ATTEMPTS,
                                    ],
                                },
                                new Date(
                                    Date.now() +
                                    LOCK_DURATION_MS
                                ),
                                "$lockUntil",
                            ],
                        },
                    },
                },
            ],
            {
                new: true,
            }
        );

    return user;
};


/**
 * Reset login security state after
 * successful authentication.
 */
const resetLoginAttempts = async (
    userId
) => {

    return User.findOneAndUpdate(
        {
            _id: userId,
            isDeleted: false,
        },
        {
            $set: {
                failedLoginAttempts: 0,
                lockUntil: null,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    );
};


module.exports = {
    create,
    findById,
    findByEmail,
    findByEmailWithPassword,
    findByPhone,
    updateById,
    updateLastLogin,
    softDelete,
    addRefreshToken,
    findByRefreshToken,
    removeRefreshToken,
    removeAllRefreshTokens,
    findByPasswordResetToken,
    recordFailedLoginAttempt,
    resetLoginAttempts,
};