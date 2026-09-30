
const dotenv = require("dotenv");

const company = require("./company");

dotenv.config({
    path: ".env",
});

const config = {
    PORT:
        process.env.PORT ||
        5000,

    NODE_ENV:
        process.env.NODE_ENV ||
        "development",

    MONGO_URI:
        process.env.MONGO_URI,

    JWT_ACCESS_SECRET:
        process.env.JWT_ACCESS_SECRET ||
        process.env.JWT_SECRET,

    JWT_ACCESS_EXPIRES_IN:
        process.env.JWT_ACCESS_EXPIRES_IN ||
        "15m",

    JWT_REFRESH_SECRET:
        process.env.JWT_REFRESH_SECRET,

    JWT_REFRESH_EXPIRES_IN:
        process.env.JWT_REFRESH_EXPIRES_IN ||
        "7d",

    ADMIN_URL:
        process.env.ADMIN_URL,

    CLIENT_URL:
        process.env.CLIENT_URL,

    DRIVER_URL:
        process.env.DRIVER_URL,

    CLOUDINARY: {
        CLOUD_NAME:
            process.env.CLOUDINARY_CLOUD_NAME,

        API_KEY:
            process.env.CLOUDINARY_API_KEY,

        API_SECRET:
            process.env.CLOUDINARY_API_SECRET,
    },

    /*
     * Company configuration
     *
     * Environment variables take priority.
     * company.js provides the application defaults.
     */
    COMPANY_NAME:
        process.env.COMPANY_NAME ||
        company.name,

    COMPANY_ADDRESS:
        process.env.COMPANY_ADDRESS ||
        company.address,

    COMPANY_PHONE:
        process.env.COMPANY_PHONE ||
        company.phone,

    COMPANY_EMAIL:
        process.env.COMPANY_EMAIL ||
        company.email,

    COMPANY_WEBSITE:
        process.env.COMPANY_WEBSITE ||
        company.website,

    COMPANY_GST:
        process.env.COMPANY_GST ||
        company.gst,

    COMPANY_PAN:
        process.env.COMPANY_PAN ||
        company.pan,

    COMPANY_CIN:
        process.env.COMPANY_CIN ||
        company.cin,

    COMPANY_LOGO:
        process.env.COMPANY_LOGO ||
        company.logo,

    SUPPORT_EMAIL:
        process.env.SUPPORT_EMAIL ||
        company.supportEmail,

    ACCOUNTS_EMAIL:
        process.env.ACCOUNTS_EMAIL ||
        company.accountsEmail,

    EMERGENCY_CONTACT:
        process.env.EMERGENCY_CONTACT ||
        "",
};

module.exports = config;
