const mongoose = require("mongoose");

const config = require("../config/env");
const User = require("../models/user.model");
const { ROLES } = require("../constants/roles");
const { STATUS } = require("../constants/status");

const ADMIN_EMAIL = "testadmin@transitfleets.local";
const ADMIN_PASSWORD = "TestAdmin@2026";
const ADMIN_NAME = "Test Admin";
const ADMIN_PHONE = "9876543211";

const seedAdmin = async () => {
    if (config.NODE_ENV === "production") {
        throw new Error(
            "Admin seed cannot be executed in production."
        );
    }

    if (!config.MONGO_URI) {
        throw new Error(
            "MONGO_URI is not configured."
        );
    }

    try {
        await mongoose.connect(config.MONGO_URI);

        console.log("====================================");
        console.log("Connected to MongoDB");
        console.log(
            `Database: ${mongoose.connection.name}`
        );
        console.log("====================================");

        let admin = await User.findOne({
            email: ADMIN_EMAIL,
            isDeleted: false,
        }).select("+password");

        if (admin) {
            if (admin.role !== ROLES.ADMIN) {
                admin.role = ROLES.ADMIN;
                admin.status = STATUS.ACTIVE;
                admin.refreshTokens = [];

                await admin.save();

                console.log(
                    "Existing test user promoted to ADMIN."
                );
            } else {
                console.log(
                    "Test ADMIN already exists."
                );
            }
        } else {
            admin = new User({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                phone: ADMIN_PHONE,
                password: ADMIN_PASSWORD,
                role: ROLES.ADMIN,
                status: STATUS.ACTIVE,
                isEmailVerified: true,
            });

            await admin.save();

            console.log(
                "Test ADMIN created successfully."
            );
        }

        console.log("------------------------------------");
        console.log("Test ADMIN credentials:");
        console.log(`Email    : ${ADMIN_EMAIL}`);
        console.log(`Password : ${ADMIN_PASSWORD}`);
        console.log(`Role     : ${ROLES.ADMIN}`);
        console.log("------------------------------------");
    } catch (error) {
        console.error(
            "Admin seed failed:"
        );
        console.error(error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

seedAdmin();