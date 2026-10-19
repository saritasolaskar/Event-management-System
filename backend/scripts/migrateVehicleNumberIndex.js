
const mongoose = require("mongoose");
const config = require("../src/config/env");

const COLLECTION_NAME = "vehicles";
const INDEX_NAME = "vehicleNumber_active_unique";

const isVehicleNumberOnlyIndex = (index) => {
  const keys = Object.keys(index.key || {});

  return (
    keys.length === 1 &&
    keys[0] === "vehicleNumber" &&
    index.key.vehicleNumber === 1
  );
};

const isActiveUniqueIndex = (index) => {
  return (
    index.unique === true &&
    isVehicleNumberOnlyIndex(index) &&
    index.partialFilterExpression?.isDeleted === false
  );
};

async function migrateVehicleNumberIndex() {
  await mongoose.connect(config.MONGO_URI);

  const collection =
    mongoose.connection.collection(COLLECTION_NAME);

  console.log("Checking active vehicle registrations...");

  const duplicates = await collection
    .aggregate([
      {
        $match: {
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$vehicleNumber",
          count: { $sum: 1 },
          vehicleIds: { $push: "$_id" },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ])
    .toArray();

  if (duplicates.length > 0) {
    console.error(
      "Migration stopped: duplicate active vehicle numbers exist."
    );

    console.error(JSON.stringify(duplicates, null, 2));

    throw new Error(
      "Resolve the listed active vehicle duplicates before retrying."
    );
  }

  let indexes = await collection.indexes();

  const existingActiveIndex =
    indexes.find(isActiveUniqueIndex);

  const obsoleteUniqueIndexes = indexes.filter(
    (index) =>
      index.unique === true &&
      isVehicleNumberOnlyIndex(index) &&
      !isActiveUniqueIndex(index) &&
      index.name !== "_id_"
  );

  for (const index of obsoleteUniqueIndexes) {
    console.log(`Removing obsolete index: ${index.name}`);

    await collection.dropIndex(index.name);
  }

  indexes = await collection.indexes();

  const activeIndexAfterCleanup =
    indexes.find(isActiveUniqueIndex);

  if (!activeIndexAfterCleanup) {
    console.log("Creating active vehicle-number index...");

    await collection.createIndex(
      { vehicleNumber: 1 },
      {
        unique: true,
        partialFilterExpression: {
          isDeleted: false,
        },
        name: INDEX_NAME,
      }
    );
  } else {
    console.log(
      `Active unique index already exists: ${activeIndexAfterCleanup.name}`
    );
  }

  console.log(
    "Vehicle-number index migration completed successfully."
  );
}

migrateVehicleNumberIndex()
  .catch((error) => {
    console.error(
      "Vehicle-number index migration failed:",
      error.message
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
