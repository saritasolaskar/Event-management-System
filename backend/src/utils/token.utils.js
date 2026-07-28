const crypto = require("crypto");

/**
 * Generate Random Token
 */
const generateRandomToken = (size = 32) => {
  return crypto.randomBytes(size).toString("hex");
};

/**
 * Calculate Expiry Date
 */
const calculateExpiry = (days) => {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

module.exports = {
  generateRandomToken,
  calculateExpiry,
};