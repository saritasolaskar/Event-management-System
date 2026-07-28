const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const { Schema } = mongoose;

const { ROLES } = require("../constants/roles");
const { USER_STATUS } = require("../constants/status");

const userSchema = new Schema(
  {
    // =====================================================
    // Personal Information
    // =====================================================

    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long."],
      maxlength: [100, "Name cannot exceed 100 characters."],
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true,
    },

    avatar: {
      type: String,
      default: null,
    },

    // =====================================================
    // Authentication
    // =====================================================

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters long."],
      select: false,
    },

    refreshTokens: [
      {
        token: {
          type: String,
          required: true,
        },

        device: {
          type: String,
          default: "Unknown Device",
        },

        ipAddress: String,

        userAgent: String,

        createdAt: {
          type: Date,
          default: Date.now,
        },

        expiresAt: {
          type: Date,
          required: true,
        },
      },
    ],

    lastLogin: {
      type: Date,
      default: null,
    },

    // =====================================================
    // Authorization
    // =====================================================

    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CLIENT,
      required: true,
    },

    // =====================================================
    // Account Status
    // =====================================================

    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.PENDING,
      required: true,
    },

    // =====================================================
    // Verification
    // =====================================================

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: String,

    passwordResetToken: String,

    passwordResetExpires: Date,

    // =====================================================
    // Security
    // =====================================================

    failedLoginAttempts: {
      type: Number,
      default: 0,
    },

    lockUntil: Date,

    // =====================================================
    // Soft Delete
    // =====================================================

    isDeleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

/**
 * =====================================================
 * Indexes
 * =====================================================
 */

userSchema.index({ email: 1 });

userSchema.index({ phone: 1 });

userSchema.index({ role: 1 });

userSchema.index({ status: 1 });

/**
 * =====================================================
 * Middleware
 * =====================================================
 */

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

/**
 * =====================================================
 * Instance Methods
 * =====================================================
 */

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

/**
 * =====================================================
 * Transform Response
 * =====================================================
 */

userSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.refreshTokens;
    delete ret.__v;

    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);