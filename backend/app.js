const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

const routes = require("./src/routes");
const notFound = require("./src/middleware/notFound.middleware");
const errorMiddleware = require("./src/middleware/error.middleware");

const routes = require("./src/routes");
const app = express();

/*
|--------------------------------------------------------------------------
| Global Middlewares
|--------------------------------------------------------------------------
*/

// Security headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Compress responses
app.use(compression());

// Parse JSON requests
app.use(express.json());

// Parse URL encoded requests
app.use(express.urlencoded({ extended: true }));

// Parse Cookies
app.use(cookieParser());

// HTTP Request Logger
app.use(morgan("dev"));

/*
|--------------------------------------------------------------------------
| Test Route
|--------------------------------------------------------------------------
*/



// Register all API routes
app.use("/api", routes);


//error API 
// 404 Handler
app.use(notFound);


//user and client routes


app.use("/api/v1", routes);



// Global Error Handler (must be last)
app.use(errorMiddleware);

module.exports = app;