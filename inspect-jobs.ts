import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { jobs } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Configure for serverless environment
neonConfig.poolQueryViaFetch = true;

const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
});

const db = drizzle(pool, { schema: { jobs } });

async function inspect() {
  try {
    console.log("Fetching all jobs...");
    const allJobs = await db.select().from(jobs);
    console.log(`\nTotal jobs in database: ${allJobs.length}\n`);

    console.log("All jobs:");
    allJobs.forEach((j) => {
      console.log(
        `  Job ${j.id}: "${j.title}" - employerId: ${
          j.employerId
        } (type: ${typeof j.employerId})`
      );
    });

    console.log("\n--- Checking for employer ID 3 ---");
    const jobsFor3 = await db.select().from(jobs).where(eq(jobs.employerId, 3));
    console.log(`Jobs where employerId = 3: ${jobsFor3.length}`);
    jobsFor3.forEach((j) => console.log(`  - Job ${j.id}: ${j.title}`));

    console.log("\n--- Checking for NULL employerIds ---");
    const nullJobs = await db.select().from(jobs);
    const nullCount = nullJobs.filter((j) => j.employerId === null).length;
    console.log(`Jobs with NULL employerId: ${nullCount}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

inspect();
