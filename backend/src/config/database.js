const mongoose = require("mongoose");
const config = require("./env");

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);

    console.log("====================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("====================================");
  } catch (error) {
    console.error("====================================");
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);
    console.error("====================================");

    process.exit(1);
  }
};

module.exports = connectDatabase;