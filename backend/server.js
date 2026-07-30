const http = require("http");

const app = require("./app");
const config = require("./src/config/env");
const connectDatabase = require("./src/config/database");

// Create HTTP Server
const server = http.createServer(app);

/**
 * Start Application
 */
const startServer = async () => {
    try {
        // Connect Database
        await connectDatabase();

        // Start HTTP Server
        server.listen(config.PORT, () => {
            console.log("====================================");
            console.log("🚀 Transit Fleets Backend Started");
            console.log(
                `🌐 Server Running : http://localhost:${config.PORT}`
            );
            console.log(
                `📦 Environment    : ${config.NODE_ENV}`
            );
            console.log("====================================");
        });
    } catch (error) {
        console.error("Server Startup Failed");
        console.error(error);
        process.exit(1);
    }
};

/**
 * Handle Unhandled Promise Rejections
 */
process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
    server.close(() => process.exit(1));
});

/**
 * Handle Uncaught Exceptions
 */
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    process.exit(1);
});

startServer();