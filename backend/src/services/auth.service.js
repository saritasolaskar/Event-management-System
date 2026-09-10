const crypto = require("crypto");

const userRepository =
    require("../repositories/user.repository");

const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
} = require("../utils/jwt.utils");

const {
    calculateExpiry,
} = require("../utils/token.utils");

const AppError =
    require("../utils/AppError");

const {
    STATUS,
} = require("../constants/status");

const {
    ROLES,
} = require("../constants/roles");


/**
 * Register User
 */
const register = async (userData) => {

    const existingEmail =
        await userRepository.findByEmail(
            userData.email
        );

    if (existingEmail) {
        throw new AppError(
            "Email already exists.",
            409
        );
    }

    const existingPhone =
        await userRepository.findByPhone(
            userData.phone
        );

    if (existingPhone) {
        throw new AppError(
            "Phone number already exists.",
            409
        );
    }

    const user = await userRepository.create({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    password: userData.password,
    avatar: userData.avatar || null,

    role: ROLES.CLIENT,
    status: STATUS.ACTIVE,

    isEmailVerified: false,

    failedLoginAttempts: 0,
    lockUntil: null,

    isDeleted: false,
});

    const accessToken =
        generateAccessToken(user);

    const refreshToken =
        generateRefreshToken(user);

    await userRepository.addRefreshToken(
        user._id,
        refreshToken,
        calculateExpiry(7)
    );

    const userObject =
        user.toObject();

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
const login = async ({
    email,
    password,
}) => {

    const user =
        await userRepository.findByEmailWithPassword(
            email
        );

    if (!user) {
        throw new AppError(
            "Invalid email or password.",
            401
        );
    }


    /**
     * Check account lock before
     * performing password authentication.
     */
    if (
        user.lockUntil &&
        user.lockUntil > new Date()
    ) {
        throw new AppError(
            "Too many failed login attempts. Please try again later.",
            429
        );
    }


    /**
     * Clear expired lock state.
     */
    if (
        user.lockUntil &&
        user.lockUntil <= new Date()
    ) {
        await userRepository.resetLoginAttempts(
            user._id
        );
    }


    const isPasswordValid =
        await user.comparePassword(
            password
        );


    /**
     * Invalid password
     */
    if (!isPasswordValid) {

        await userRepository.recordFailedLoginAttempt(
            user._id
        );

        throw new AppError(
            "Invalid email or password.",
            401
        );
    }


    /**
     * Account must be active.
     */
    if (
        user.status !== STATUS.ACTIVE ||
        user.isDeleted
    ) {
        throw new AppError(
            "Your account is inactive.",
            403
        );
    }


    /**
     * Successful login:
     * reset brute-force protection state.
     */
    await userRepository.resetLoginAttempts(
        user._id
    );


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


    const userObject =
        user.toObject();

    delete userObject.password;

    return {
        user: userObject,
        accessToken,
        refreshToken,
    };
};


/**
 * Create Password Setup Token
 *
 * Used when an Admin/Operations Manager
 * creates a Driver account.
 */
const createPasswordSetupToken = async (
    userId
) => {

    const user =
        await userRepository.findById(
            userId
        );

    if (!user) {
        throw new AppError(
            "User not found.",
            404
        );
    }

    const rawToken =
        crypto
            .randomBytes(32)
            .toString("hex");

    const hashedToken =
        crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

    const expiresAt =
        new Date(
            Date.now() +
            30 * 60 * 1000
        );

    await userRepository.updateById(
        userId,
        {
            passwordResetToken:
                hashedToken,

            passwordResetExpires:
                expiresAt,
        }
    );

    return rawToken;
};


/**
 * Set Password Using Setup Token
 */
const setPassword = async (
    token,
    password
) => {

    const hashedToken =
        crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

    const user =
        await userRepository.findByPasswordResetToken(
            hashedToken
        );

    if (!user) {
        throw new AppError(
            "Invalid or expired password setup token.",
            400
        );
    }

    if (
        !user.passwordResetExpires ||
        user.passwordResetExpires < new Date()
    ) {
        throw new AppError(
            "Invalid or expired password setup token.",
            400
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

    user.password = password;

    user.passwordResetToken =
        undefined;

    user.passwordResetExpires =
        undefined;

    /**
     * Invalidate all existing sessions
     * after password creation/change.
     */
    user.refreshTokens = [];

    user.failedLoginAttempts = 0;
    user.lockUntil = null;

    await user.save();

    return {
        message:
            "Password set successfully. You can now log in.",
    };
};


/**
 * Refresh Access Token
 */
const refreshToken = async (
    token
) => {

    verifyRefreshToken(token);

    const user =
        await userRepository.findByRefreshToken(
            token
        );

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


    /**
     * Token rotation.
     *
     * The old refresh token is removed
     * before the new one is stored.
     */
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
        refreshToken:
            newRefreshToken,
    };
};


/**
 * Logout User
 */
const logout = async (
    refreshToken
) => {

    verifyRefreshToken(
        refreshToken
    );

    const user =
        await userRepository.findByRefreshToken(
            refreshToken
        );

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
        message:
            "Logged out successfully.",
    };
};


/**
 * Logout From All Devices
 */
const logoutAllDevices = async (
    userId
) => {

    await userRepository.removeAllRefreshTokens(
        userId
    );

    return {
        message:
            "Logged out from all devices.",
    };
};


module.exports = {
    register,
    login,
    createPasswordSetupToken,
    setPassword,
    refreshToken,
    logout,
    logoutAllDevices,
};