const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// Main API Routes
const routes = require("./src/routes");
const trackingRoutes =require("./src/routes/tracking.routes");
const notificationRoutes =require("./src/routes/notification.routes");
const auditLogRoutes =require("./src/routes/auditLog.routes");
// PDF Routes
const dutyPdfRoutes = require("./src/routes/dutyPdf.routes");
const guestManifestPdfRoutes = require("./src/routes/guestManifestPdf.routes");
const clientInvoicePdfRoutes = require("./src/routes/clientInvoicePdf.routes");
const vendorBillPdfRoutes = require("./src/routes/vendorBillPdf.routes");


// Middlewares
const notFound = require("./src/middleware/notFound.middleware");
const errorMiddleware = require("./src/middleware/error.middleware");

const app = express();

/*
|--------------------------------------------------------------------------
| Global Middlewares
|--------------------------------------------------------------------------
*/

// Security Headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Compress Responses
app.use(compression());

// Parse JSON
app.use(express.json());

// Parse URL Encoded Data
app.use(express.urlencoded({ extended: true }));

// Parse Cookies
app.use(cookieParser());

// HTTP Logger
app.use(morgan("dev"));

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Main API Routes
app.use("/api/v1", routes);

// PDF Routes
app.use("/api/v1/duty", dutyPdfRoutes);

app.use(
    "/api/v1/guest-manifest",
    guestManifestPdfRoutes
);

app.use(
    "/api/v1/client-invoices",
    clientInvoicePdfRoutes
);

app.use(
    "/api/v1/vendor-bills",
    vendorBillPdfRoutes
);

app.use(
    "/api/v1/tracking",
    trackingRoutes
);

app.use(
    "/api/v1/notifications",
    notificationRoutes
);

app.use(
    "/api/v1/audit-logs",
    auditLogRoutes
);

/*
|--------------------------------------------------------------------------
| Error Handling
|--------------------------------------------------------------------------
*/

// 404 Handler
app.use(notFound);

// Global Error Handler (Always Last)
app.use(errorMiddleware);

module.exports = app;