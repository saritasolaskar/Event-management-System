const authService = require("../services/auth.service");

const asyncHandler = require("../utils/asyncHandler");
const { successResponse } = require("../utils/response.utils");

/**
 * Register User
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  return successResponse(
    res,
    201,
    "User registered successfully.",
    result
  );
});

/**
 * Login User
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);

  return successResponse(
    res,
    200,
    "Login successful.",
    result
  );
});

/**
 * Logout User
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  const result = await authService.logout(
    refreshToken
  );

  return successResponse(
    res,
    200,
    result.message
  );
});

const refreshToken = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);

  return successResponse(
    res,
    200,
    "Token refreshed successfully.",
    result
  );
});

const logoutAllDevices = asyncHandler(async (req, res) => {
  const result = await authService.logoutAllDevices(req.user._id);

  return successResponse(
    res,
    200,
    result.message
  );
});

module.exports = {
  register,
  login,
  logout,
  logoutAllDevices,
  refreshToken,
};