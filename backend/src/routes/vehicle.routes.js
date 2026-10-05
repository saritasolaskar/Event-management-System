const express = require("express");

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

const multer = require("multer");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (
        req,
        file,
        cb
    ) => {

        const allowed =
            [
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "application/vnd.ms-excel",
            ];

        if (
            allowed.includes(
                file.mimetype
            )
        ) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Only Excel files (.xlsx or .xls) are allowed."
                )
            );
        }
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
 * Update Vehicle
 */
router.put(
  "/:id",
  protect,
  authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
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
    authorize(ROLES.ADMIN, ROLES.OPERATIONS_MANAGER),
    vehicleStatusValidator,
    validate,
    vehicleController.updateVehicleStatus
);



module.exports = router;