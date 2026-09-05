const express = require("express");

const authRoutes = require("./auth.routes");
const clientRoutes = require("./client.routes");
const eventRoutes = require("./event.routes");
const guestRoutes = require("./guest.routes");
const locationRoutes = require("./location.routes");
const vendorRoutes = require("./vendor.routes");
const driverRoutes = require("./driver.routes");
const vehicleRoutes = require("./vehicle.routes");
const vehicleAssignmentRoutes = require("./vehicleAssignment.routes");
const guestAssignmentRoutes = require("./guestAssignment.routes");
const dutyRoutes = require("./duty.routes");
const driverTrackingRoutes = require("./driverTracking.routes");
// const billingRoutes = require("./billing.routes");
const vendorBillRoutes = require("./vendorBill.routes");
const clientInvoiceRoutes = require("./clientInvoice.routes");
const billingApprovalRoutes = require("./billingApproval.routes");
const clientPortalRoutes = require("./clientPortal.routes");
const driverApiRoutes = require("./driverApi.routes");
const dutyPdfRoutes = require("./dutyPdf.routes");
const guestManifestPdfRoutes = require("./guestManifestPdf.routes");
const userRoutes = require("./user.routes");
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes); 
router.use("/clients", clientRoutes);
router.use("/events", eventRoutes);
router.use("/guests", guestRoutes);
router.use("/locations", locationRoutes);
router.use("/vendors", vendorRoutes);
router.use("/drivers", driverRoutes);
router.use("/vehicles", vehicleRoutes);

router.use("/vehicle-assignments", vehicleAssignmentRoutes);
router.use("/guest-assignments", guestAssignmentRoutes);

router.use("/duties", dutyRoutes);
router.use("/tracking", driverTrackingRoutes);

// router.use("/billing", billingRoutes);
router.use("/vendor-bills", vendorBillRoutes);
router.use("/client-invoices", clientInvoiceRoutes);
router.use("/billing-approval", billingApprovalRoutes);

router.use("/client-portal", clientPortalRoutes);
router.use("/driver", driverApiRoutes);

router.use("/duty-sheet", dutyPdfRoutes);
router.use("/guest-manifest", guestManifestPdfRoutes);

module.exports = router;