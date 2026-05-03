const mongoose = require("mongoose");
const { connectDatabase } = require("../src/config/database");
const { resetDatabase } = require("../src/services/seedService");

async function main() {
  try {
    await connectDatabase();
    await resetDatabase();
    console.log("DB reset + seed completado.");
  } catch (error) {
    console.error("No se pudo resetear la BD:", error?.message || error);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  }
}

main();

