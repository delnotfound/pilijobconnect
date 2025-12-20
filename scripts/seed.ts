import * as dotenv from "dotenv";
// Load env vars FIRST before any other imports
dotenv.config();

// Now import after env vars are loaded
async function main() {
  try {
    console.log("Starting database seeding...");
    // Dynamic import to ensure env vars are loaded first
    const { seedDatabase } = await import("../api/server/seed.js");
    await seedDatabase();
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}

main();
