const express = require("express");

const authRoutes = require("./auth.routes");
const clientRoutes = require("./client.routes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/clients", clientRoutes);

module.exports = router;