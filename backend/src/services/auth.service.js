const userRepository = require("../repositories/user.repository");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwt.utils");

const { calculateExpiry } = require("../utils/token.utils");

const AppError = require("../utils/AppError.utils");

/**
 * Register User
 */
const register = async (userData) => {
  const existingEmail = await userRepository.findByEmail(userData.email);

  if (existingEmail) {
    throw new AppError("Email already exists.", 409);
  }

  const existingPhone = await userRepository.findByPhone(userData.phone);

  if (existingPhone) {
    throw new AppError("Phone number already exists.", 409);
  }

  const user = await userRepository.create(userData);

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await userRepository.addRefreshToken(
    user._id,
    refreshToken,
    calculateExpiry(7)
  );

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Login User
 */
const login = async ({ email, password }) => {
  // Find user including password
  const user = await userRepository.findByEmailWithPassword(email);

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  // Compare password
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", 401);
  }

  // Check account status
  if (user.status !== "ACTIVE") {
    throw new AppError("Your account is inactive.", 403);
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Store refresh token
  await userRepository.addRefreshToken(
    user._id,
    refreshToken,
    calculateExpiry(7)
  );

  // Update last login
  await userRepository.updateLastLogin(user._id);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
*.  refresh tokens
*/

const refreshToken = async (token) => {
  // Verify JWT
  const payload = verifyRefreshToken(token);

  // Find User
  const user = await userRepository.findByRefreshToken(token);

  if (!user) {
    throw new AppError("Invalid refresh token.", 401);
  }

  // Remove old token
  await userRepository.removeRefreshToken(user._id, token);

  // Generate new tokens
  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Store new refresh token
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
  // Verify refresh token
  verifyRefreshToken(refreshToken);

  // Find user
  const user = await userRepository.findByRefreshToken(refreshToken);

  if (!user) {
    throw new AppError(
      "Invalid refresh token.",
      401
    );
  }

  // Remove refresh token
  await userRepository.removeRefreshToken(
    user._id,
    refreshToken
  );

  return {
    message: "Logged out successfully."
  };
};

const logoutAllDevices = async (userId) => {
  await userRepository.removeAllRefreshTokens(
    userId
  );

  return {
    message:
      "Logged out from all devices."
  };
};


module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAllDevices,
};