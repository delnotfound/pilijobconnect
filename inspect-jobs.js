const db = require("./api/server/db.js").db;
const { jobs } = require("./shared/schema.js");
const { eq } = require("drizzle-orm");

async function check() {
  try {
    const allJobs = await db.select().from(jobs);
    console.log("Total jobs:", allJobs.length);
    console.log("\nAll jobs:");
    allJobs.forEach((j) => {
      console.log(
        `  Job ${j.id}: "${j.title}" - employerId: ${
          j.employerId
        } (type: ${typeof j.employerId})`
      );
    });

    console.log("\n--- Checking for employer ID 3 ---");
    const jobsFor3 = await db.select().from(jobs).where(eq(jobs.employerId, 3));
    console.log("Jobs where employerId = 3:", jobsFor3.length);
    jobsFor3.forEach((j) => console.log(`  - Job ${j.id}: ${j.title}`));
  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

check();
