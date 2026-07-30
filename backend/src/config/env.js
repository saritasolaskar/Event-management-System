const dotenv = require("dotenv");

dotenv.config({ path: ".env" });

const config = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: process.env.MONGO_URI,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,

  ADMIN_URL: process.env.ADMIN_URL,
  CLIENT_URL: process.env.CLIENT_URL,
  DRIVER_URL: process.env.DRIVER_URL,

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
};

module.exports = config;