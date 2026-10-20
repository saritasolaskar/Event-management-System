
const express = require("express");
const path = require("path");
const multer = require("multer");

const vehicleController = require("../controllers/vehicle.controller");
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/authorize.middleware");
const validate = require("../middleware/validate");

const { ROLES } = require("../constants/roles");

const {
  createVehicleValidator,
  updateVehicleValidator,
  vehicleIdValidator,
  vehicleStatusValidator,
} = require("../validators/vehicle.validator");

const router = express.Router();

const ADMIN_VEHICLE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.OPERATIONS_MANAGER,
];

const VEHICLE_READ_ROLES = [
  ...ADMIN_VEHICLE_ROLES,
  ROLES.DISPATCHER,
];

const ALLOWED_EXCEL_EXTENSIONS = new Set([".xlsx", ".xls"]);

const ALLOWED_EXCEL_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/octet-stream",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    const extension = path
      .extname(file.originalname || "")
      .toLowerCase();

    const mimeType = String(file.mimetype || "").toLowerCase();

    if (
      !ALLOWED_EXCEL_EXTENSIONS.has(extension) ||
      !ALLOWED_EXCEL_MIME_TYPES.has(mimeType)
    ) {
      return callback(
        new Error("Please upload a valid .xlsx or .xls Excel file.")
      );
    }

    callback(null, true);
  },
});

// Create a vehicle or register it for an event.
router.post(
  "/",
  protect,
  authorize(...ADMIN_VEHICLE_ROLES),
  createVehicleValidator,
  validate,
  vehicleController.createVehicle
);

// Get all active vehicles.
router.get(
  "/",
  protect,
  authorize(...VEHICLE_READ_ROLES),
  vehicleController.getAllVehicles
);

// Get vehicles registered for a particular event.
router.get(
  "/event/:eventId",
  protect,
  authorize(...VEHICLE_READ_ROLES),
  vehicleController.getVehiclesByEvent
);

// Import vehicles for an event from Excel.
router.post(
  "/import",
  protect,
  authorize(...ADMIN_VEHICLE_ROLES),
  upload.single("file"),
  vehicleController.importVehiclesFromExcel
);

// Get one vehicle.
router.get(
  "/:id",
  protect,
  authorize(...VEHICLE_READ_ROLES),
  vehicleIdValidator,
  validate,
  vehicleController.getVehicleById
);

// Update vehicle details.
router.put(
  "/:id",
  protect,
  authorize(...ADMIN_VEHICLE_ROLES),
  updateVehicleValidator,
  validate,
  vehicleController.updateVehicle
);

// Delete a vehicle.
router.delete(
  "/:id",
  protect,
  authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN),
  vehicleIdValidator,
  validate,
  vehicleController.deleteVehicle
);

// Update vehicle status.
router.patch(
  "/:id/status",
  protect,
  authorize(...ADMIN_VEHICLE_ROLES),
  vehicleStatusValidator,
  validate,
  vehicleController.updateVehicleStatus
);

module.exports = router;
