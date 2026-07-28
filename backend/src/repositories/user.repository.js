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
  return User.findById(userId);
};

/**
 * Find user by email
 * Password is excluded by default (select:false)
 */
const findByEmail = async (email) => {
  return User.findOne({ email });
};

/**
 * Find user by email with password
 * Used only during login
 */
const findByEmailWithPassword = async (email) => {
  return User.findOne({ email }).select("+password");
};

/**
 * Update user
 */
const updateById = async (userId, updateData) => {
  return User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });
};

/**
 * Update Last Login
 */
const updateLastLogin = async (userId) => {
  return User.findByIdAndUpdate(userId, {
    lastLogin: new Date(),
  });
};

/**
 * Soft Delete
 */
const softDelete = async (userId) => {
  return User.findByIdAndUpdate(userId, {
    isDeleted: true,
    deletedAt: new Date(),
  });
};

const findByPhone = async (phone) => {
  return User.findOne({ phone });
};


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
    }
  );
};

const findByRefreshToken = async (token) => {
  return User.findOne({
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
    }
  );
};

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
    }
  );
};

module.exports = {
  create,
  findById,
  findByEmail,
  findByEmailWithPassword,
  findByPhone,
  addRefreshToken,
  removeRefreshToken,
  updateLastLogin,
  updateById,
  softDelete,
  findByRefreshToken,
  removeAllRefreshTokens,
};