import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { jobs, users } from "./shared/schema.js";
import { eq, isNull, sql } from "drizzle-orm";

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set");
}

neonConfig.poolQueryViaFetch = true;

const pool = new Pool({ connectionString: databaseUrl });
const db = drizzle(pool);

async function fixEmployerIds() {
  try {
    console.log("Starting employer ID fix...");

    // Get all jobs and their details
    const allJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        employerId: jobs.employerId,
      })
      .from(jobs);

    console.log(`Found ${allJobs.length} total jobs in database`);
    console.log("Jobs:", allJobs);

    // Find jobs with NULL or invalid employerId
    const invalidJobs = allJobs.filter(
      (job) => !job.employerId || typeof job.employerId !== "number"
    );
    console.log(
      `Found ${invalidJobs.length} jobs with invalid employerId:`,
      invalidJobs
    );

    // Find jobs with employer ID 3 (the test employer)
    const employer3Jobs = allJobs.filter((job) => job.employerId === 3);
    console.log(
      `Found ${employer3Jobs.length} jobs with employerId 3:`,
      employer3Jobs
    );

    // Check if there are any jobs with a user object instead of ID
    const jobsWithWrongType = allJobs.filter(
      (job) => typeof job.employerId === "object"
    );
    console.log(
      `Found ${jobsWithWrongType.length} jobs with object employerId:`,
      jobsWithWrongType
    );

    // Get all users
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users);

    console.log(`Found ${allUsers.length} users:`, allUsers);

    // Get all employer users
    const employers = allUsers.filter((u) => u.role === "employer");
    console.log(`Found ${employers.length} employers:`, employers);

    console.log("\nSummary:");
    console.log(`- Total jobs: ${allJobs.length}`);
    console.log(`- Jobs with null/invalid employerId: ${invalidJobs.length}`);
    console.log(`- Jobs with employer 3: ${employer3Jobs.length}`);
    console.log(`- Total employers: ${employers.length}`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

fixEmployerIds();
