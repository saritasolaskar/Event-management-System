const config = require("./env");

const allowedOrigins = [
    config.ADMIN_URL,
    config.CLIENT_URL,
    config.DRIVER_URL,

    // Local development
    "http://localhost:5173",
    "http://localhost:5174",
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow non-browser requests such as Postman/mobile clients.
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(
            new Error("Origin not allowed by CORS.")
        );
    },

    credentials: true,
};

module.exports = corsOptions;