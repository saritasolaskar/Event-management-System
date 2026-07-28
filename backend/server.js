const http = require("http");

const app = require("./app");
const config = require("./src/config/env");
const connectDatabase = require("./src/config/database");

// Create HTTP Server
const server = http.createServer(app);

// Start Application
const startServer = async () => {
  try {
    // Connect Database
    await connectDatabase();

    // Start HTTP Server
    server.listen(config.PORT, () => {
      console.log("====================================");
      console.log("🚀 CTMS Backend Started");
      console.log(`🌐 Server Running : http://localhost:${config.PORT}`);
      console.log(`📦 Environment    : ${config.NODE_ENV}`);
      console.log("====================================");
    });

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

startServer();