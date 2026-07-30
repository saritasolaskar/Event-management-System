const userRepository = require("../repositories/user.repository");

const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} = require("../utils/jwt.utils");

const { calculateExpiry } = require("../utils/token.utils");

const AppError = require("../utils/AppError.utils");

const { STATUS } = require("../constants/status");

/**
 * Register User
 */
const register = async (userData) => {

    const existingEmail =
        await userRepository.findByEmail(userData.email);

    if (existingEmail) {
        throw new AppError(
            "Email already exists.",
            409
        );
    }

    const existingPhone =
        await userRepository.findByPhone(userData.phone);

    if (existingPhone) {
        throw new AppError(
            "Phone number already exists.",
            409
        );
    }

    const user =
        await userRepository.create(userData);

    const accessToken =
        generateAccessToken(user);

    const refreshToken =
        generateRefreshToken(user);

    await userRepository.addRefreshToken(
        user._id,
        refreshToken,
        calculateExpiry(7)
    );

    const userObject = user.toObject();
    delete userObject.password;

    return {
        user: userObject,
        accessToken,
        refreshToken,
    };
};

/**
 * Login User
 */
const login = async ({ email, password }) => {

    const user =
        await userRepository.findByEmailWithPassword(email);

    if (!user) {
        throw new AppError(
            "Invalid email or password.",
            401
        );
    }

    const isPasswordValid =
        await user.comparePassword(password);

    if (!isPasswordValid) {
        throw new AppError(
            "Invalid email or password.",
            401
        );
    }

    if (
        user.status !== STATUS.ACTIVE ||
        user.isDeleted
    ) {
        throw new AppError(
            "Your account is inactive.",
            403
        );
    }

    const accessToken =
        generateAccessToken(user);

    const refreshToken =
        generateRefreshToken(user);

    await userRepository.addRefreshToken(
        user._id,
        refreshToken,
        calculateExpiry(7)
    );

    await userRepository.updateLastLogin(
        user._id
    );

    const userObject = user.toObject();
    delete userObject.password;

    return {
        user: userObject,
        accessToken,
        refreshToken,
    };
};

/**
 * Refresh Access Token
 */
const refreshToken = async (token) => {

    verifyRefreshToken(token);

    const user =
        await userRepository.findByRefreshToken(token);

    if (!user) {
        throw new AppError(
            "Invalid refresh token.",
            401
        );
    }

    if (
        user.status !== STATUS.ACTIVE ||
        user.isDeleted
    ) {
        throw new AppError(
            "Your account is inactive.",
            403
        );
    }

    await userRepository.removeRefreshToken(
        user._id,
        token
    );

    const accessToken =
        generateAccessToken(user);

    const newRefreshToken =
        generateRefreshToken(user);

    await userRepository.addRefreshToken(
        user._id,
        newRefreshToken,
        calculateExpiry(7)
    );

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
};

/**
 * Logout User
 */
const logout = async (refreshToken) => {

    verifyRefreshToken(refreshToken);

    const user =
        await userRepository.findByRefreshToken(refreshToken);

    if (!user) {
        throw new AppError(
            "Invalid refresh token.",
            401
        );
    }

    await userRepository.removeRefreshToken(
        user._id,
        refreshToken
    );

    return {
        message: "Logged out successfully.",
    };
};

/**
 * Logout From All Devices
 */
const logoutAllDevices = async (userId) => {

    await userRepository.removeAllRefreshTokens(
        userId
    );

    return {
        message: "Logged out from all devices.",
    };
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    logoutAllDevices,
};