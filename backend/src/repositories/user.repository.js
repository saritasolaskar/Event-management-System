const User = require("../models/user.model");

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
 * Password is excluded by default
 */
const findByEmail = async (email) => {
    return User.findOne({
        email,
        isDeleted: false,
    });
};

/**
 * Find user by email with password
 * Used during login
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
 */
const updateById = async (userId, updateData) => {
    return User.findByIdAndUpdate(
        userId,
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
    return User.findByIdAndUpdate(
        userId,
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
    return User.findByIdAndUpdate(
        userId,
        {
            isDeleted: true,
            deletedAt: new Date(),
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

/**
 * Add Refresh Token
 */
const addRefreshToken = async (
    userId,
    refreshToken,
    expiresAt,
    device = "Unknown Device",
    ipAddress = null,
    userAgent = null
) => {
    return User.findByIdAndUpdate(
        userId,
        {
            $push: {
                refreshTokens: {
                    token: refreshToken,
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
const findByRefreshToken = async (token) => {
    return User.findOne({
        isDeleted: false,
        "refreshTokens.token": token,
    });
};

/**
 * Remove Refresh Token
 */
const removeRefreshToken = async (userId, refreshToken) => {
    return User.findByIdAndUpdate(
        userId,
        {
            $pull: {
                refreshTokens: {
                    token: refreshToken,
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
const removeAllRefreshTokens = async (userId) => {
    return User.findByIdAndUpdate(
        userId,
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
};