
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

const ALLOWED_EXCEL_EXTENSIONS = new Set([
  ".xlsx",
  ".xls",
]);

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

    const mimeType = String(file.mimetype || "")
      .toLowerCase();

    const validExtension =
      ALLOWED_EXCEL_EXTENSIONS.has(extension);

    const validMimeType =
      ALLOWED_EXCEL_MIME_TYPES.has(mimeType);

    if (!validExtension || !validMimeType) {
      return callback(
        new Error(
          "Please upload a valid .xlsx or .xls Excel file."
        )
      );
    }

    callback(null, true);
  },
});

/**
 * Create Vehicle
 */
router.post(
  "/",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
  createVehicleValidator,
  validate,
  vehicleController.createVehicle
);

/**
 * Get All Vehicles
 */
router.get(
  "/",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER
  ),
  vehicleController.getAllVehicles
);

/**
 * Get Vehicles By Event
 */
router.get(
  "/event/:eventId",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER
  ),
  vehicleController.getVehiclesByEvent
);

/**
 * Import Event Vehicles From Excel
 */
router.post(
  "/import",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER
  ),
  upload.single("file"),
  vehicleController.importVehiclesFromExcel
);

/**
 * Get Vehicle By ID
 */
router.get(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER,
    ROLES.DISPATCHER
  ),
  vehicleIdValidator,
  validate,
  vehicleController.getVehicleById
);

/**
 * Update Vehicle
 */
router.put(
  "/:id",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER
  ),
  updateVehicleValidator,
  validate,
  vehicleController.updateVehicle
);

/**
 * Delete Vehicle
 */
router.delete(
  "/:id",
  protect,
  authorize(ROLES.ADMIN),
  vehicleIdValidator,
  validate,
  vehicleController.deleteVehicle
);

/**
 * Update Vehicle Status
 */
router.patch(
  "/:id/status",
  protect,
  authorize(
    ROLES.ADMIN,
    ROLES.OPERATIONS_MANAGER
  ),
  vehicleStatusValidator,
  validate,
  vehicleController.updateVehicleStatus
);

module.exports = router;
