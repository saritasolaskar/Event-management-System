const crypto = require("crypto");

const User = require("../models/user.model");

const hashRefreshToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

const create = async (userData, session = null) => {
    if (session) {
        const [user] = await User.create(
            [userData],
            { session }
        );
        return user;
    }

    return User.create(userData);
};

const findById = async (userId, session = null) => {
    const query = User.findOne({
        _id: userId,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

const findByEmail = async (email, session = null) => {
    const query = User.findOne({
        email,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

const findByEmailWithPassword = async (
    email,
    session = null
) => {
    const query = User.findOne({
        email,
        isDeleted: false,
    }).select("+password");

    if (session) {
        query.session(session);
    }

    return query;
};

const findByPhone = async (phone, session = null) => {
    const query = User.findOne({
        phone,
        isDeleted: false,
    });

    if (session) {
        query.session(session);
    }

    return query;
};

const updateById = async (
    userId,
    updateData,
    session = null
) => {
    const query = User.findOneAndUpdate(
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

    if (session) {
        query.session(session);
    }

    return query;
};

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

const removeAllRefreshTokens = async (userId) => {
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

const findByPasswordResetToken = async (token) => {
    return User.findOne({
        passwordResetToken: token,
        isDeleted: false,
    }).select("+password");
};

const recordFailedLoginAttempt = async (userId) => {
    const MAX_ATTEMPTS = 5;
    const LOCK_DURATION_MS = 15 * 60 * 1000;

    return User.findOneAndUpdate(
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
};

const resetLoginAttempts = async (userId) => {
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