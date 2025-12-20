import { neonConfig, Pool } from "@neondatabase/serverless";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../..");
dotenv.config({ path: path.join(envPath, ".env") });

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

neonConfig.poolQueryViaFetch = true;
const pool = new Pool({ connectionString: databaseUrl });

async function runMigrations() {
  try {
    console.log("Starting migrations...");

    const migrationsDir = path.join(process.cwd(), "migrations");
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql") && f !== "0000_fuzzy_mongu.sql")
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");

      const client = await pool.connect();
      try {
        // Split by lines and execute non-empty, non-comment statements
        const statements = sql
          .split("\n")
          .filter((line) => line.trim() && !line.trim().startsWith("--"))
          .join("\n")
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s);

        for (const statement of statements) {
          try {
            console.log(`  Executing: ${statement.substring(0, 80)}...`);
            await client.query(statement);
          } catch (err: any) {
            // Skip "already exists" errors
            if (
              err.code === "42701" ||
              err.message?.includes("already exists")
            ) {
              console.log(`  ⚠ Column already exists, skipping...`);
            } else {
              throw err;
            }
          }
        }
        console.log(`  ✓ Migration ${file} completed`);
      } finally {
        client.release();
      }
    }

    console.log("All migrations completed successfully!");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
