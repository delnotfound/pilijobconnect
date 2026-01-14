import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import * as schema from "./shared/schema.js";
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

const db = drizzle(pool, { schema });

async function inspect() {
  try {
    console.log("\n=== CHECKING APPLICATIONS ===\n");

    const allApps = await db.select().from(schema.applications);
    console.log(`Total applications in database: ${allApps.length}\n`);

    // Get applications for each job of employer 3
    const employerJobs = await db
      .select()
      .from(schema.jobs)
      .where(eq(schema.jobs.employerId, 3));
    console.log(`Jobs for employer 3: ${employerJobs.length}`);
    employerJobs.forEach((j) => console.log(`  - Job ${j.id}: ${j.title}`));

    console.log("\nApplications by job:");
    for (const job of employerJobs) {
      const jobApps = await db
        .select()
        .from(schema.applications)
        .where(eq(schema.applications.jobId, job.id));
      console.log(
        `  Job ${job.id} (${job.title}): ${jobApps.length} applications`
      );
      jobApps.forEach((app) => {
        console.log(
          `    - App ${app.id}: ${app.firstName} ${app.lastName} (${app.email}) - Status: ${app.status}`
        );
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

inspect();
