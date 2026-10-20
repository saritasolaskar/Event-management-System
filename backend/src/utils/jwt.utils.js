const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * Generate Access Token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role,
        },
        config.JWT_ACCESS_SECRET,
        {
            expiresIn: config.JWT_ACCESS_EXPIRES_IN,
        }
    );
};

/**
 * Generate Refresh Token
 */
const generateRefreshToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
        },
        config.JWT_REFRESH_SECRET,
        {
            expiresIn: config.JWT_REFRESH_EXPIRES_IN,
        }
    );
};

/**
 * Verify Access Token
 */
const verifyAccessToken = (token) => {
    return jwt.verify(
        token,
        config.JWT_ACCESS_SECRET
    );
};

/**
 * Verify Refresh Token
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(
        token,
        config.JWT_REFRESH_SECRET
    );
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
};