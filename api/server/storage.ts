import {
  jobs,
  applications,
  employers,
  categories,
  savedJobs,
  jobAlerts,
  jobMatches,
  users,
  userSessions,
  sessions,
  type Job,
  type InsertJob,
  type UpdateJob,
  type Application,
  type InsertApplication,
  type UpdateApplication,
  type Employer,
  type InsertEmployer,
  type Category,
  type InsertCategory,
  type SavedJob,
  type InsertSavedJob,
  type JobAlert,
  type InsertJobAlert,
  type User,
  type InsertUser,
  type RegisterUser,
  type UserSession,
  type InsertUserSession,
} from "../../shared/schema.js";
import { db } from "./db.js";
import {
  eq,
  and,
  or,
  ilike,
  desc,
  asc,
  sql,
  count,
  like,
  inArray,
  gte,
  lt,
  isNotNull,
} from "drizzle-orm";
import { RunResult } from "better-sqlite3";

// Ensure we're using PostgreSQL in production
if (process.env.NODE_ENV === "production" && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required in production");
}

// Extend RunResult to include rowCount
interface CustomRunResult extends RunResult {
  rowCount?: number;
}

export interface IStorage {
  // Job methods
  getAllJobs(options?: {
    includeInactive?: boolean;
    featuredFirst?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Job[]>;
  getJob(id: number): Promise<Job | undefined>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: number, job: UpdateJob): Promise<Job | undefined>;
  deleteJob(id: number): Promise<boolean>;
  incrementJobViews(id: number): Promise<void>;
  searchJobs(
    query: string,
    filters?: {
      location?: string;
      type?: string;
      category?: string;
      salary?: string;
      featuredOnly?: boolean;
      jobTypes?: string[];
    },
    options?: {
      limit?: number;
      offset?: number;
      sortBy?:
        | "newest"
        | "oldest"
        | "salary_high"
        | "salary_low"
        | "views"
        | "applications";
    }
  ): Promise<Job[]>;
  getFeaturedJobs(): Promise<Job[]>;
  getJobsByCategory(category: string): Promise<Job[]>;
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  getApplicationsByEmployer(
    employerId: number
  ): Promise<Array<Application & { jobTitle: string }>>;

  // Application methods
  getApplicationsForJob(jobId: number): Promise<Application[]>;
  getApplicationsByApplicant(email: string): Promise<
    Array<
      Application & {
        job: {
          title: string;
          company: string;
          location: string;
          type: string;
          salary: string;
        };
      }
    >
  >;
  createApplication(application: InsertApplication): Promise<Application>;
  updateApplication(
    id: number,
    application: UpdateApplication
  ): Promise<Application | undefined>;
  deleteApplication(id: number): Promise<boolean>;
  getApplicationsByEmail(email: string): Promise<Application[]>;
  getApplicationById(id: number): Promise<Application | undefined>;
  getApplicationsByEmployer(employerId: number): Promise<Application[]>;

  // Employer methods
  createEmployer(employer: InsertEmployer): Promise<Employer>;
  getEmployer(id: number): Promise<Employer | undefined>;
  getEmployerByEmail(email: string): Promise<Employer | undefined>;
  updateEmployer(
    id: number,
    employer: Partial<Employer>
  ): Promise<Employer | undefined>;

  // Category methods
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategoryJobCount(
    categoryName: string,
    increment: number
  ): Promise<void>;

  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;

  // Saved jobs methods
  saveJob(userId: number, jobId: number): Promise<SavedJob>;
  unsaveJob(userId: number, jobId: number): Promise<boolean>;
  getSavedJobs(userId: number): Promise<
    Array<{
      id: number;
      userId: number;
      jobId: number;
      savedAt: Date;
      job: Job;
    }>
  >;
  isJobSaved(userEmail: string, jobId: number): Promise<boolean>;

  // Job alerts methods
  createJobAlert(alert: InsertJobAlert): Promise<JobAlert>;
  getUserJobAlerts(userId: number): Promise<JobAlert[]>;
  updateJobAlert(
    id: number,
    alert: Partial<JobAlert>
  ): Promise<JobAlert | undefined>;
  deleteJobAlert(id: number): Promise<boolean>;

  // Analytics methods
  getJobStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalEmployers: number;
    totalJobSeekers: number;
    applicationsToday: number;
    categoriesWithCounts: Array<{ category: string; count: number }>;
    recentJobs: Job[];
  }>;

  // Verification methods
  getPendingVerifications(): Promise<User[]>;

  // Admin methods
  getAdminStats(): Promise<{
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
    activeJobs: number;
    pendingApplications: number;
    featuredJobs: number;
    totalEmployers: number;
    totalJobSeekers: number;
    applicationsToday: number;
    jobsPostedToday: number;
    usersRegisteredToday: number;
    jobViewsToday: number;
  }>;
  getCategoryStats(): Promise<
    Array<{
      category: string;
      jobCount: number;
      applicationCount: number;
      avgSalary: string;
    }>
  >;
  getJobTypeStats(): Promise<
    Array<{
      type: string;
      count: number;
      percentage: number;
    }>
  >;
  getTrends(): Promise<
    Array<{
      date: string;
      applications: number;
      jobs: number;
    }>
  >;
  getRecentActivity(): Promise<
    Array<{
      id: number;
      type: "application" | "job_posted" | "user_registered";
      message: string;
      timestamp: string;
    }>
  >;
  getAllUsers(): Promise<User[]>;
  getAllApplicationsAdmin(): Promise<Array<Application & { jobTitle: string }>>;
  getAllApplicationsWithJobs(): Promise<Array<Application & { job: Job }>>;
  updateApplication(
    id: number,
    application: UpdateApplication
  ): Promise<Application | undefined>;
  updateJob(id: number, job: UpdateJob): Promise<Job | undefined>;
  clearAllData(): Promise<void>;
  getActivityTrends(): Promise<
    Array<{
      day: string;
      jobs: number;
      applications: number;
    }>
  >;
  getInDemandJobs(): Promise<
    Array<{
      title: string;
      totalApplications: number;
      totalPostings: number;
      companiesHiring: number;
    }>
  >;
  getInDemandSkills(): Promise<
    Array<{
      skill: string;
      demandFromEmployers: number;
      availableFromSeekers: number;
      gap: number;
    }>
  >;
  getSalaryTrends(): Promise<{
    categoryAverages: Array<{
      category: string;
      averageSalary: number;
      minSalary: number;
      maxSalary: number;
      jobCount: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      categories: Array<{ category: string; averageSalary: number }>;
    }>;
  }>;
  getPesoStats(): Promise<{
    placementRate: number;
    totalApplications: number;
    totalHired: number;
    localEmploymentRate: number;
    totalLocalJobs: number;
    totalJobs: number;
    monthlyStats: Array<{
      month: string;
      applications: number;
      hired: number;
      jobs: number;
      newSeekers: number;
      placementRate: number;
    }>;
    categoryHiring: Array<{
      category: string;
      applications: number;
      hired: number;
      rate: number;
    }>;
  }>;
  getUsers(): Promise<User[]>;
  getAllApplications(): Promise<Array<Application & { jobTitle: string }>>;
}

export class DatabaseStorage implements IStorage {
  // Job methods
  async getAllJobs(options?: {
    includeInactive?: boolean;
    featuredFirst?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    const baseQuery = db.select().from(jobs);

    if (!options?.includeInactive) {
      if (options?.featuredFirst) {
        return await baseQuery
          .where(eq(jobs.isActive, true))
          .orderBy(desc(jobs.isFeatured), desc(jobs.postedAt))
          .limit(options?.limit || 1000)
          .offset(options?.offset || 0);
      } else {
        return await baseQuery
          .where(eq(jobs.isActive, true))
          .orderBy(desc(jobs.postedAt))
          .limit(options?.limit || 1000)
          .offset(options?.offset || 0);
      }
    } else {
      if (options?.featuredFirst) {
        return await baseQuery
          .orderBy(desc(jobs.isFeatured), desc(jobs.postedAt))
          .limit(options?.limit || 1000)
          .offset(options?.offset || 0);
      } else {
        return await baseQuery
          .orderBy(desc(jobs.postedAt))
          .limit(options?.limit || 1000)
          .offset(options?.offset || 0);
      }
    }
  }

  async getJob(id: number): Promise<Job | undefined> {
    const result = await db.select().from(jobs).where(eq(jobs.id, id));
    return result[0] || undefined;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const result = await db
      .insert(jobs)
      .values({
        ...insertJob,
        postedAt: new Date(), // Store as Date object
        isFeatured: false,
        viewCount: 0,
        updatedAt: new Date(),
      })
      .returning();

    // Update category count
    await this.updateCategoryJobCount(insertJob.category, 1);

    return result[0];
  }

  async updateJob(id: number, jobUpdate: UpdateJob): Promise<Job | undefined> {
    const result = await db
      .update(jobs)
      .set({ ...jobUpdate, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteJob(id: number): Promise<boolean> {
    const job = await this.getJob(id);
    if (!job) return false;

    // PostgreSQL: delete returns array of deleted rows with .returning()
    const result = await db.delete(jobs).where(eq(jobs.id, id)).returning();
    return result.length > 0;
  }

  async incrementJobViews(jobId: number): Promise<void> {
    try {
      await db
        .update(jobs)
        .set({ viewCount: sql`${jobs.viewCount} + 1`, updatedAt: new Date() })
        .where(eq(jobs.id, jobId));
    } catch (error) {
      console.error("Error incrementing job views:", error);
    }
  }

  async searchJobs(
    query: string,
    filters?: {
      location?: string;
      type?: string;
      category?: string;
      salary?: string;
      jobTypes?: string[];
      featuredOnly?: boolean;
    },
    options?: {
      limit?: number;
      offset?: number;
      sortBy?:
        | "newest"
        | "oldest"
        | "salary_high"
        | "salary_low"
        | "views"
        | "applications";
    }
  ): Promise<Job[]> {
    let conditions = [eq(jobs.isActive, true)];

    // Add text search if query provided
    if (query && query.trim()) {
      const searchTerm = `%${query.trim().toLowerCase()}%`;
      conditions.push(
        or(
          sql`LOWER(${jobs.title}) LIKE ${searchTerm}`,
          sql`LOWER(${jobs.company}) LIKE ${searchTerm}`,
          sql`LOWER(${jobs.description}) LIKE ${searchTerm}`,
          sql`LOWER(${jobs.category}) LIKE ${searchTerm}`
        )!
      );
    }

    // Apply filters
    if (
      filters?.location &&
      filters.location !== "Pili (All Areas)" &&
      filters.location.trim() !== ""
    ) {
      const locationTerm = `%${filters.location.trim().toLowerCase()}%`;
      conditions.push(sql`LOWER(${jobs.location}) LIKE ${locationTerm}`);
    }

    if (filters?.type) {
      conditions.push(eq(jobs.type, filters.type));
    }

    if (filters?.category && filters.category !== "All Categories") {
      conditions.push(eq(jobs.category, filters.category));
    }

    if (filters?.salary && filters.salary !== "Any Salary") {
      // Handle salary range filtering
      if (filters.salary.includes("-")) {
        // For salary ranges like "₱15,000 - ₱25,000"
        const salaryTerm = `%${filters.salary.toLowerCase()}%`;
        conditions.push(sql`LOWER(${jobs.salary}) LIKE ${salaryTerm}`);
      } else {
        conditions.push(eq(jobs.salary, filters.salary));
      }
    }

    // Handle multiple job types
    if (filters?.jobTypes && filters.jobTypes.length > 0) {
      const jobTypeConditions = filters.jobTypes.map((jobType) =>
        eq(jobs.type, jobType)
      );
      conditions.push(or(...jobTypeConditions)!);
    }

    if (filters?.featuredOnly) {
      conditions.push(eq(jobs.isFeatured, true));
    }

    // Determine sort order
    let orderByClause;
    switch (options?.sortBy) {
      case "oldest":
        orderByClause = asc(jobs.postedAt);
        break;
      case "views":
        orderByClause = desc(jobs.viewCount);
        break;
      case "applications":
        orderByClause = desc(jobs.applicantCount);
        break;
      default:
        orderByClause = [desc(jobs.isFeatured), desc(jobs.postedAt)];
    }

    // Build complete query
    const baseQuery = db
      .select()
      .from(jobs)
      .where(and(...conditions))
      .orderBy(
        ...(Array.isArray(orderByClause) ? orderByClause : [orderByClause])
      );

    // Apply pagination if specified
    if (options?.limit && options?.offset) {
      return await baseQuery.limit(options.limit).offset(options.offset);
    } else if (options?.limit) {
      return await baseQuery.limit(options.limit);
    } else if (options?.offset) {
      return await baseQuery.offset(options.offset);
    } else {
      return await baseQuery;
    }
  }

  async getFeaturedJobs(): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.isActive, true), eq(jobs.isFeatured, true)))
      .orderBy(desc(jobs.postedAt));
  }

  async getJobsByCategory(category: string): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.category, category), eq(jobs.isActive, true)))
      .orderBy(desc(jobs.postedAt));
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return await db
      .select()
      .from(jobs)
      .where(eq(jobs.employerId, employerId))
      .orderBy(desc(jobs.postedAt));
  }

  async getApplicationsByEmployer(
    employerId: number
  ): Promise<Array<Application & { jobTitle: string }>> {
    const applicationsWithJobTitles = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        applicantId: applications.applicantId,
        firstName: applications.firstName,
        middleName: applications.middleName,
        lastName: applications.lastName,
        email: applications.email,
        phone: applications.phone,
        address: applications.address,
        coverLetter: applications.coverLetter,
        resume: applications.resume,
        status: applications.status,
        channelId: applications.channelId,
        notes: applications.notes,
        interviewDate: applications.interviewDate,
        interviewTime: applications.interviewTime,
        interviewVenue: applications.interviewVenue,
        interviewType: applications.interviewType,
        interviewNotes: applications.interviewNotes,
        notProceedingReason: applications.notProceedingReason,
        smsNotificationSent: applications.smsNotificationSent,
        appliedAt: applications.appliedAt,
        updatedAt: applications.updatedAt,
        jobTitle: jobs.title,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(jobs.employerId, employerId))
      .orderBy(desc(applications.appliedAt));

    return applicationsWithJobTitles;
  }

  // Application methods
  async getApplicationsForJob(jobId: number): Promise<Application[]> {
    return await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        applicantId: applications.applicantId,
        firstName: applications.firstName,
        middleName: applications.middleName,
        lastName: applications.lastName,
        email: applications.email,
        phone: applications.phone,
        address: applications.address,
        coverLetter: applications.coverLetter,
        resume: applications.resume,
        status: applications.status,
        channelId: applications.channelId,
        notes: applications.notes,
        interviewDate: applications.interviewDate,
        interviewTime: applications.interviewTime,
        interviewVenue: applications.interviewVenue,
        interviewType: applications.interviewType,
        interviewNotes: applications.interviewNotes,
        notProceedingReason: applications.notProceedingReason,
        smsNotificationSent: applications.smsNotificationSent,
        appliedAt: applications.appliedAt,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .where(eq(applications.jobId, jobId))
      .orderBy(desc(applications.appliedAt));
  }

  // Scout Candidates for Employers
  async scoutCandidates(filters: {
    skills: string[];
    experienceLevel?: string;
    location?: string;
  }): Promise<
    Array<{
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      address: string | null;
      skills: string | null;
      desiredRoles: string | null;
      experienceLevel: string | null;
      preferredLocation: string | null;
      matchScore: number;
      matchingSkills: string[];
    }>
  > {
    // Get all job seekers with profiles
    const jobSeekers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        address: users.address,
        skills: users.skills,
        desiredRoles: users.desiredRoles,
        experienceLevel: users.experienceLevel,
        preferredLocation: users.preferredLocation,
      })
      .from(users)
      .where(
        and(
          eq(users.role, "jobseeker"),
          eq(users.isActive, true),
          isNotNull(users.skills)
        )
      );

    const searchSkills = filters.skills.map((s) => s.toLowerCase().trim());

    // Score each candidate
    const scoredCandidates = jobSeekers.map((candidate: any) => {
      const candidateSkills = (candidate.skills || "")
        .toLowerCase()
        .split(",")
        .map((s: any) => s.trim());
      const candidateRoles = (candidate.desiredRoles || "")
        .toLowerCase()
        .split(",")
        .map((r: any) => r.trim());

      // Combine all candidate text for comprehensive matching
      const allCandidateText = `${candidate.skills || ""} ${
        candidate.desiredRoles || ""
      }`.toLowerCase();

      // Find matching skills with VERY flexible matching
      const matchingSkills: string[] = [];
      let totalMatches = 0;

      for (const searchSkill of searchSkills) {
        let found = false;

        // Check each candidate skill for partial match
        for (const candidateSkill of candidateSkills) {
          if (
            candidateSkill.includes(searchSkill) ||
            searchSkill.includes(candidateSkill)
          ) {
            if (!matchingSkills.includes(candidateSkill)) {
              matchingSkills.push(candidateSkill);
            }
            found = true;
            totalMatches += 3; // Full skill match
          }
        }

        // Also check roles
        for (const role of candidateRoles) {
          if (role.includes(searchSkill) || searchSkill.includes(role)) {
            if (!matchingSkills.includes(role)) {
              matchingSkills.push(role);
            }
            found = true;
            totalMatches += 2; // Role match
          }
        }

        // Check for word-level matches in all text
        if (!found && allCandidateText.includes(searchSkill)) {
          matchingSkills.push(searchSkill);
          totalMatches += 1; // Partial match
        }
      }

      // Calculate skill match percentage - very generous scoring
      let skillMatchScore = 0;
      if (searchSkills.length > 0 && matchingSkills.length > 0) {
        // Give 100% if any match is found
        const matchRatio = totalMatches / (searchSkills.length * 3);
        skillMatchScore = Math.min(100, Math.round(matchRatio * 100));

        // Boost score if we have direct matches
        if (matchingSkills.length >= searchSkills.length) {
          skillMatchScore = 100;
        }
      }

      // Experience level match (bonus)
      let experienceBonus = 0;
      if (
        filters.experienceLevel &&
        candidate.experienceLevel === filters.experienceLevel
      ) {
        experienceBonus = 20;
      }

      // Location removed since all candidates are from Pili

      const matchScore = Math.min(100, skillMatchScore + experienceBonus);

      return {
        ...candidate,
        matchScore,
        matchingSkills,
      };
    });

    // Filter candidates with at least one matching skill and sort by score
    return scoredCandidates
      .filter((candidate: any) => candidate.matchingSkills.length > 0)
      .sort((a: any, b: any) => b.matchScore - a.matchScore);
  }

  // Job Matching Methods
  async calculateJobMatch(
    userId: number,
    jobId: number
  ): Promise<{
    matchScore: number;
    skillMatch: number;
    locationMatch: number;
    roleMatch: number;
  }> {
    const user = await this.getUserById(userId);
    const job = await this.getJob(jobId);

    if (!user || !job) {
      return { matchScore: 0, skillMatch: 0, locationMatch: 0, roleMatch: 0 };
    }

    // Parse user skills and roles into individual words (including 2-letter words for max sensitivity)
    const userSkills = (user.skills || "")
      .toLowerCase()
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);
    const userSkillWords = userSkills
      .flatMap((skill) => skill.split(/\s+/))
      .filter((w) => w.length > 1);

    // Build comprehensive job text for matching - include ALL text fields
    const jobText = `${job.title || ""} ${job.description || ""} ${
      job.requirements || ""
    } ${job.category || ""} ${job.requiredSkills || ""} ${job.benefits || ""} ${
      job.company || ""
    }`.toLowerCase();

    // Calculate skill match (50% weight) - ULTRA sensitive matching
    let skillMatch = 0;
    if (userSkills.length > 0 || userSkillWords.length > 0) {
      let matchCount = 0;
      let totalWords = userSkillWords.length;

      // Check each skill phrase
      for (const skill of userSkills) {
        if (jobText.includes(skill)) {
          matchCount += 3; // Full phrase match gets triple points
        }
      }

      // Check individual skill words - ANY word match counts!
      for (const word of userSkillWords) {
        if (jobText.includes(word)) {
          matchCount += 1;
        }
      }

      // Give high score even for a single match
      if (matchCount > 0) {
        // Even 1 match out of 10 words = 30% skill match
        skillMatch = Math.min(
          100,
          (matchCount / Math.max(1, totalWords)) * 300
        );
      }
    }

    // Calculate role match (50% weight) - ULTRA sensitive (location removed since all in Pili)
    let roleMatch = 0;
    const desiredRoles = (user.desiredRoles || "")
      .toLowerCase()
      .split(",")
      .map((r) => r.trim())
      .filter((r) => r);
    const desiredRoleWords = desiredRoles
      .flatMap((role) => role.split(/\s+/))
      .filter((w) => w.length > 1);
    const jobTitle = job.title.toLowerCase();
    const jobCategory = (job.category || "").toLowerCase();
    const jobTitleAndCategory = `${jobTitle} ${jobCategory} ${jobText}`;

    if (desiredRoles.length > 0 || desiredRoleWords.length > 0) {
      let roleMatchCount = 0;
      let totalRoleWords = desiredRoleWords.length;

      // Check full role phrases
      for (const role of desiredRoles) {
        if (jobTitleAndCategory.includes(role)) {
          roleMatchCount += 3;
        }
      }

      // Check individual role words - ANY word match counts!
      for (const word of desiredRoleWords) {
        if (jobTitleAndCategory.includes(word)) {
          roleMatchCount += 1;
        }
      }

      // Give high score even for a single match
      if (roleMatchCount > 0) {
        roleMatch = Math.min(
          100,
          (roleMatchCount / Math.max(1, totalRoleWords)) * 300
        );
      }
    }

    // Calculate weighted total score (location removed since all in Pili)
    const matchScore = skillMatch * 0.5 + roleMatch * 0.5;

    return {
      matchScore: Math.round(matchScore),
      skillMatch: Math.round(skillMatch),
      locationMatch: 0, // Not used
      roleMatch: Math.round(roleMatch),
    };
  }

  async getJobRecommendations(
    userId: number,
    limit: number = 20
  ): Promise<any[]> {
    const user = await this.getUserById(userId);
    if (!user || user.role !== "jobseeker") {
      return [];
    }

    // Get all active jobs
    const activeJobs = await this.getAllJobs({ includeInactive: false });

    if (activeJobs.length === 0) {
      console.log("No active jobs found for recommendations");
      return [];
    }

    console.log(`Found ${activeJobs.length} active jobs for recommendations`);

    // Calculate match scores for each job
    const matches = await Promise.all(
      activeJobs.map(async (job) => {
        const scores = await this.calculateJobMatch(userId, job.id);
        return {
          ...job,
          matchScore: scores.matchScore,
          skillMatch: scores.skillMatch,
          locationMatch: scores.locationMatch,
          roleMatch: scores.roleMatch,
        };
      })
    );

    // Filter jobs with score > 6 (5-7% threshold for better matching accuracy) and sort by match score
    const recommendations = matches
      .filter((m) => m.matchScore > 6)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    console.log(
      `Filtered to ${recommendations.length} recommendations with score > 6 (6% minimum match)`
    );

    // Store matches in database
    for (const rec of recommendations) {
      try {
        await db
          .insert(jobMatches)
          .values({
            userId,
            jobId: rec.id,
            matchScore: rec.matchScore,
            skillMatch: rec.skillMatch,
            locationMatch: rec.locationMatch,
            roleMatch: rec.roleMatch,
          })
          .onConflictDoUpdate({
            target: [jobMatches.userId, jobMatches.jobId],
            set: {
              matchScore: rec.matchScore,
              skillMatch: rec.skillMatch,
              locationMatch: rec.locationMatch,
              roleMatch: rec.roleMatch,
            },
          });
      } catch (error) {
        console.error("Error storing job match:", error);
      }
    }

    return recommendations;
  }

  async updateMatchFeedback(
    userId: number,
    jobId: number,
    feedback: "thumbs_up" | "thumbs_down"
  ): Promise<void> {
    await db
      .update(jobMatches)
      .set({ userFeedback: feedback })
      .where(and(eq(jobMatches.userId, userId), eq(jobMatches.jobId, jobId)));
  }

  async createApplication(
    insertApplication: InsertApplication
  ): Promise<Application> {
    await db
      .insert(applications)
      .values({
        ...insertApplication,
        appliedAt: new Date(),
        status: "pending",
        updatedAt: new Date(),
      });

    // Increment applicant count for the job
    await db
      .update(jobs)
      .set({ applicantCount: sql`${jobs.applicantCount} + 1` })
      .where(eq(jobs.id, insertApplication.jobId));

    // Query the application back
    const appList = await db
      .select()
      .from(applications)
      .where(eq(applications.jobId, insertApplication.jobId))
      .limit(10);

    if (!appList || appList.length === 0) {
      throw new Error("Failed to create application");
    }

    // Return the most recent application for this job
    return appList[appList.length - 1];
  }

  async updateApplication(
    id: number,
    applicationUpdate: UpdateApplication
  ): Promise<Application | undefined> {
    const result = await db
      .update(applications)
      .set({ ...applicationUpdate, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteApplication(id: number): Promise<boolean> {
    const application = await this.getApplicationById(id);
    if (!application) return false;

    const result = await db
      .delete(applications)
      .where(eq(applications.id, id))
      .returning();

    // Decrement applicant count for the job
    await db
      .update(jobs)
      .set({ applicantCount: sql`${jobs.applicantCount} - 1` })
      .where(eq(jobs.id, application.jobId));

    return result.length > 0;
  }

  async getApplicationsByEmail(email: string): Promise<Application[]> {
    return await db
      .select()
      .from(applications)
      .where(eq(applications.email, email))
      .orderBy(desc(applications.appliedAt));
  }

  async getApplicationsByApplicant(email: string): Promise<
    Array<
      Application & {
        job: {
          title: string;
          company: string;
          location: string;
          type: string;
          salary: string;
        };
      }
    >
  > {
    const applicationsWithJobs = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        applicantId: applications.applicantId,
        firstName: applications.firstName,
        middleName: applications.middleName,
        lastName: applications.lastName,
        email: applications.email,
        phone: applications.phone,
        address: applications.address,
        coverLetter: applications.coverLetter,
        resume: applications.resume,
        status: applications.status,
        channelId: applications.channelId,
        notes: applications.notes,
        interviewDate: applications.interviewDate,
        interviewTime: applications.interviewTime,
        interviewVenue: applications.interviewVenue,
        interviewType: applications.interviewType,
        interviewNotes: applications.interviewNotes,
        notProceedingReason: applications.notProceedingReason,
        smsNotificationSent: applications.smsNotificationSent,
        appliedAt: applications.appliedAt,
        updatedAt: applications.updatedAt,
        job: {
          title: jobs.title,
          company: jobs.company,
          location: jobs.location,
          type: jobs.type,
          salary: jobs.salary,
        },
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .where(eq(applications.email, email))
      .orderBy(desc(applications.appliedAt));

    return applicationsWithJobs;
  }

  async getApplicationById(id: number): Promise<Application | undefined> {
    const result = await db
      .select()
      .from(applications)
      .where(eq(applications.id, id));
    return result[0] || undefined;
  }

  // Employer methods
  async createEmployer(employer: InsertEmployer): Promise<Employer> {
    const result = await db.insert(employers).values(employer).returning();
    return result[0];
  }

  async getEmployer(id: number): Promise<Employer | undefined> {
    const result = await db
      .select()
      .from(employers)
      .where(eq(employers.id, id));
    return result[0] || undefined;
  }

  async getEmployerByEmail(email: string): Promise<Employer | undefined> {
    const result = await db
      .select()
      .from(employers)
      .where(eq(employers.email, email));
    return result[0] || undefined;
  }

  async updateEmployer(
    id: number,
    employerUpdate: Partial<Employer>
  ): Promise<Employer | undefined> {
    const result = await db
      .update(employers)
      .set({ ...employerUpdate, updatedAt: new Date() })
      .where(eq(employers.id, id))
      .returning();
    return result[0] || undefined;
  }

  // Category methods
  async getAllCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(desc(categories.jobCount), asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategoryJobCount(
    categoryName: string,
    increment: number
  ): Promise<void> {
    await db
      .update(categories)
      .set({ jobCount: sql`${categories.jobCount} + ${increment}` })
      .where(eq(categories.name, categoryName));
  }

  // User methods
  async createUser(user: InsertUser): Promise<User> {
    const userData = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date(),
      verificationStatus: user.role === "employer" ? "pending" : null,
    };

    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0] || undefined;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const result = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Saved jobs methods
  async saveJob(userId: number, jobId: number): Promise<SavedJob> {
    const [savedJob] = await db
      .insert(savedJobs)
      .values({ userId, jobId })
      .onConflictDoNothing()
      .returning();
    return savedJob;
  }

  async unsaveJob(userId: number, jobId: number): Promise<boolean> {
    const result = await db
      .delete(savedJobs)
      .where(and(eq(savedJobs.userId, userId), eq(savedJobs.jobId, jobId)))
      .returning();
    return result.length > 0;
  }

  async getSavedJobs(userId: number): Promise<
    Array<{
      id: number;
      userId: number;
      jobId: number;
      savedAt: Date;
      job: Job;
    }>
  > {
    const result = await db
      .select({
        id: savedJobs.id,
        userId: savedJobs.userId,
        jobId: savedJobs.jobId,
        savedAt: savedJobs.savedAt,
        job: jobs,
      })
      .from(savedJobs)
      .innerJoin(jobs, eq(savedJobs.jobId, jobs.id))
      .where(eq(savedJobs.userId, userId))
      .orderBy(desc(savedJobs.savedAt));

    return result;
  }

  async isJobSaved(userEmail: string, jobId: number): Promise<boolean> {
    // For backward compatibility, convert email to user ID
    const user = await this.getUserByEmail(userEmail);
    if (!user) return false;

    const result = await db
      .select()
      .from(savedJobs)
      .where(and(eq(savedJobs.userId, user.id), eq(savedJobs.jobId, jobId)));
    return result.length > 0;
  }

  // Job alerts methods
  async createJobAlert(alert: InsertJobAlert): Promise<JobAlert> {
    const result = await db.insert(jobAlerts).values(alert).returning();
    return result[0];
  }

  async getUserJobAlerts(userId: number): Promise<JobAlert[]> {
    return await db
      .select()
      .from(jobAlerts)
      .where(eq(jobAlerts.userId, userId))
      .orderBy(desc(jobAlerts.createdAt));
  }

  // For backward compatibility
  async getJobAlerts(userEmail: string): Promise<JobAlert[]> {
    const user = await this.getUserByEmail(userEmail);
    if (!user) return [];
    return this.getUserJobAlerts(user.id);
  }

  async updateJobAlert(
    id: number,
    alertUpdate: Partial<JobAlert>
  ): Promise<JobAlert | undefined> {
    const result = await db
      .update(jobAlerts)
      .set(alertUpdate)
      .where(eq(jobAlerts.id, id))
      .returning();
    return result[0] || undefined;
  }

  async deleteJobAlert(id: number): Promise<boolean> {
    const result = await db
      .delete(jobAlerts)
      .where(eq(jobAlerts.id, id))
      .returning();
    return result.length > 0;
  }

  // Analytics methods
  async getJobStats(): Promise<{
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalEmployers: number;
    totalJobSeekers: number;
    applicationsToday: number;
    categoriesWithCounts: Array<{ category: string; count: number }>;
    recentJobs: Job[];
  }> {
    try {
      const allJobs = await this.getAllJobs();
      
      let totalApplicationsCount = 0;
      let totalEmployersCount = 0;
      let totalJobSeekersCount = 0;
      let applicationsToday = 0;
      let categoriesWithCounts: Array<{ category: string; count: number }> = [];

      try {
        // Get application count
        const appCountResult = await db
          .select({ count: count() })
          .from(applications);
        totalApplicationsCount = appCountResult[0]?.count || 0;
      } catch (e) {
        console.log("Failed to get application count, using 0");
      }

      try {
        // Get employer count
        const empCountResult = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.role, "employer"));
        totalEmployersCount = empCountResult[0]?.count || 0;
      } catch (e) {
        console.log("Failed to get employer count, using 0");
      }

      try {
        // Get job seeker count
        const jskCountResult = await db
          .select({ count: count() })
          .from(users)
          .where(eq(users.role, "jobseeker"));
        totalJobSeekersCount = jskCountResult[0]?.count || 0;
      } catch (e) {
        console.log("Failed to get job seeker count, using 0");
      }

      try {
        // Get today's application count
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(applications)
          .where(gte(applications.appliedAt, today));
        applicationsToday = todayResult[0]?.count || 0;
      } catch (e) {
        console.log("Failed to get today's applications, using 0");
      }

      try {
        // Get category counts
        categoriesWithCounts = await db
          .select({
            category: jobs.category,
            count: count(),
          })
          .from(jobs)
          .where(eq(jobs.isActive, true))
          .groupBy(jobs.category);
      } catch (e) {
        console.log("Failed to get category counts");
      }

      return {
        activeJobs: allJobs.filter((job) => job.isActive).length,
        totalJobs: allJobs.length,
        totalApplications: totalApplicationsCount,
        totalEmployers: totalEmployersCount,
        totalJobSeekers: totalJobSeekersCount,
        applicationsToday: applicationsToday,
        categoriesWithCounts: categoriesWithCounts,
        recentJobs: allJobs
          .filter((job) => job.isActive)
          .sort(
            (a, b) =>
              new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
          )
          .slice(0, 5),
      };
    } catch (error) {
      console.error("Error in getJobStats:", error);
      // Return safe defaults
      return {
        activeJobs: 0,
        totalJobs: 0,
        totalApplications: 0,
        totalEmployers: 0,
        totalJobSeekers: 0,
        applicationsToday: 0,
        categoriesWithCounts: [],
        recentJobs: [],
      };
    }
  }

  // Admin methods
  async getAdminStats() {
    console.log("=== GETTING ADMIN STATS BASED ON RECENT ACTIVITY ===");

    // Get basic counts
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [totalJobs] = await db.select({ count: count() }).from(jobs);
    const [totalApplications] = await db
      .select({ count: count() })
      .from(applications);
    const [activeJobs] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.isActive, true));
    const [pendingApplications] = await db
      .select({ count: count() })
      .from(applications)
      .where(eq(applications.status, "pending"));
    const [featuredJobs] = await db
      .select({ count: count() })
      .from(jobs)
      .where(eq(jobs.isFeatured, true));
    const [totalEmployers] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "employer"));
    const [totalJobSeekers] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, "jobseeker"));

    // Get recent activity to determine "today" based on actual data
    const recentJobs = await db
      .select({ postedAt: jobs.postedAt })
      .from(jobs)
      .orderBy(desc(jobs.postedAt))
      .limit(10);

    const recentApplications = await db
      .select({ appliedAt: applications.appliedAt })
      .from(applications)
      .orderBy(desc(applications.appliedAt))
      .limit(10);

    const recentUsers = await db
      .select({ createdAt: users.createdAt })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    // Find the most recent activity date to use as "today"
    const allDates = [
      ...recentJobs.map((j: any) => j.postedAt),
      ...recentApplications.map((a: any) => a.appliedAt),
      ...recentUsers.map((u: any) => u.createdAt),
    ].filter(Boolean);

    let applicationsToday = 0;
    let jobsPostedToday = 0;
    let usersRegisteredToday = 0;

    if (allDates.length > 0) {
      const latestDate = new Date(
        Math.max(...allDates.map((d) => d.getTime()))
      );
      const startOfDay = new Date(
        latestDate.getFullYear(),
        latestDate.getMonth(),
        latestDate.getDate()
      );
      const endOfDay = new Date(
        latestDate.getFullYear(),
        latestDate.getMonth(),
        latestDate.getDate() + 1
      );

      console.log(
        "Using latest activity date as 'today':",
        latestDate.toISOString()
      );
      console.log(
        "Date range:",
        startOfDay.toISOString(),
        "to",
        endOfDay.toISOString()
      );

      // Count activities for "today" (the most recent activity day)
      applicationsToday = recentApplications.filter(
        (a: any) => a.appliedAt >= startOfDay && a.appliedAt < endOfDay
      ).length;

      jobsPostedToday = recentJobs.filter(
        (j: any) => j.postedAt >= startOfDay && j.postedAt < endOfDay
      ).length;

      usersRegisteredToday = recentUsers.filter(
        (u: any) => u.createdAt >= startOfDay && u.createdAt < endOfDay
      ).length;

      console.log("Today's counts:", {
        applicationsToday,
        jobsPostedToday,
        usersRegisteredToday,
      });
    }

    // Get total job views from all active jobs
    const [jobViewsToday] = await db
      .select({
        totalViews: sql<number>`COALESCE(SUM(${jobs.viewCount}), 0)`,
      })
      .from(jobs)
      .where(eq(jobs.isActive, true));

    const result = {
      totalUsers: totalUsers?.count || 0,
      totalJobs: totalJobs?.count || 0,
      totalApplications: totalApplications?.count || 0,
      activeJobs: activeJobs?.count || 0,
      pendingApplications: pendingApplications?.count || 0,
      featuredJobs: featuredJobs?.count || 0,
      totalEmployers: totalEmployers?.count || 0,
      totalJobSeekers: totalJobSeekers?.count || 0,
      applicationsToday: applicationsToday,
      jobsPostedToday: jobsPostedToday,
      usersRegisteredToday: usersRegisteredToday,
      jobViewsToday: jobViewsToday?.totalViews || 0,
    };

    console.log("Final admin stats:", result);
    return result;
  }

  async getCategoryStats() {
    const categoryStats = await db
      .select({
        category: jobs.category,
        jobCount: count(jobs.id),
        applicationCount: count(applications.id),
      })
      .from(jobs)
      .leftJoin(applications, eq(jobs.id, applications.jobId))
      .groupBy(jobs.category);

    return categoryStats.map((stat: any) => ({
      category: stat.category,
      jobCount: stat.jobCount,
      applicationCount: stat.applicationCount || 0,
      avgSalary: "₱15,000 - ₱30,000", // Placeholder for now
    }));
  }

  async getJobTypeStats() {
    const typeStats = await db
      .select({
        type: jobs.type,
        count: count(),
      })
      .from(jobs)
      .where(eq(jobs.isActive, true))
      .groupBy(jobs.type);

    const totalCount = typeStats.reduce(
      (sum: any, stat: any) => sum + stat.count,
      0
    );

    return typeStats.map((stat: any) => ({
      type: stat.type,
      count: stat.count,
      percentage: Math.round((stat.count / totalCount) * 100),
    }));
  }

  async getTrends() {
    console.log("=== GETTING TRENDS BASED ON RECENT ACTIVITY ===");

    // Get recent activity data that we know exists
    const recentJobs = await db
      .select({ id: jobs.id, postedAt: jobs.postedAt, title: jobs.title })
      .from(jobs)
      .orderBy(desc(jobs.postedAt))
      .limit(10);

    const recentApplications = await db
      .select({
        id: applications.id,
        appliedAt: applications.appliedAt,
        jobId: applications.jobId,
      })
      .from(applications)
      .orderBy(desc(applications.appliedAt))
      .limit(10);

    const recentUsers = await db
      .select({ id: users.id, createdAt: users.createdAt, email: users.email })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10);

    console.log("Recent jobs:", recentJobs);
    console.log("Recent applications:", recentApplications);
    console.log("Recent users:", recentUsers);

    // Create trends data based on the actual recent activity
    const trends = [];

    // Get the most recent date from all activities
    const allDates = [
      ...recentJobs.map((j: any) => j.postedAt),
      ...recentApplications.map((a: any) => a.appliedAt),
      ...recentUsers.map((u: any) => u.createdAt),
    ].filter(Boolean);

    if (allDates.length === 0) {
      console.log("No recent activity found");
      return [{ date: "No Data", jobs: 0, applications: 0, users: 0 }];
    }

    const latestDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
    console.log("Latest activity date:", latestDate.toISOString());

    // Create 7 days of data centered around the most recent activity
    for (let i = 6; i >= 0; i--) {
      const date = new Date(latestDate.getTime() - i * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      // Count activities for this day
      const jobsCount = recentJobs.filter(
        (j: any) => j.postedAt >= startOfDay && j.postedAt < endOfDay
      ).length;

      const applicationsCount = recentApplications.filter(
        (a: any) => a.appliedAt >= startOfDay && a.appliedAt < endOfDay
      ).length;

      const usersCount = recentUsers.filter(
        (u: any) => u.createdAt >= startOfDay && u.createdAt < endOfDay
      ).length;

      const dayData = {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        jobs: jobsCount,
        applications: applicationsCount,
        users: usersCount,
      };

      console.log(`Day ${i} (${date.toISOString()}):`, dayData);
      trends.push(dayData);
    }

    console.log("Final trends based on recent activity:", trends);
    return trends;
  }

  async getRecentActivity() {
    // Get recent applications
    const recentApps = await db
      .select({
        id: applications.id,
        firstName: applications.firstName,
        lastName: applications.lastName,
        appliedAt: applications.appliedAt,
        jobTitle: jobs.title,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.appliedAt))
      .limit(5);

    // Get recent job postings
    const recentJobs = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        company: jobs.company,
        postedAt: jobs.postedAt,
      })
      .from(jobs)
      .orderBy(desc(jobs.postedAt))
      .limit(5);

    // Get recent user registrations
    const recentUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(5);

    // Combine all activities
    const activities: any[] = [];

    recentApps.forEach((app: any) => {
      activities.push({
        id: `app-${app.id}`,
        type: "application",
        message: `${app.firstName} ${app.lastName} applied for ${app.jobTitle}`,
        timestamp: app.appliedAt,
      });
    });

    recentJobs.forEach((job: any) => {
      activities.push({
        id: `job-${job.id}`,
        type: "job_posted",
        message: `New job posted: ${job.title} at ${job.company}`,
        timestamp: job.postedAt,
      });
    });

    recentUsers.forEach((user: any) => {
      activities.push({
        id: `user-${user.id}`,
        type: "user_registered",
        message: `${user.firstName} ${user.lastName} registered as ${user.role}`,
        timestamp: user.createdAt,
      });
    });

    // Sort by timestamp (most recent first)
    activities.sort((a, b) => b.timestamp - a.timestamp);

    return activities.slice(0, 10);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAllApplicationsAdmin() {
    const applicationsWithJobTitles = await db
      .select({
        id: applications.id,
        firstName: applications.firstName,
        middleName: applications.middleName,
        lastName: applications.lastName,
        email: applications.email,
        phone: applications.phone,
        address: applications.address,
        coverLetter: applications.coverLetter,
        status: applications.status,
        channelId: applications.channelId,
        smsNotificationSent: applications.smsNotificationSent,
        appliedAt: applications.appliedAt,
        jobTitle: jobs.title,
        jobId: applications.jobId,
        applicantId: applications.applicantId,
        resume: applications.resume,
        notes: applications.notes,
        interviewDate: applications.interviewDate,
        interviewTime: applications.interviewTime,
        interviewVenue: applications.interviewVenue,
        interviewType: applications.interviewType,
        interviewNotes: applications.interviewNotes,
        notProceedingReason: applications.notProceedingReason,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.appliedAt));

    return applicationsWithJobTitles;
  }

  async getAllTablesData() {
    const tableNames = [
      "users",
      "jobs",
      "applications",
      "employers",
      "categories",
      "saved_jobs",
      "job_alerts",
      "user_sessions",
      "sessions",
    ];
    const tablesData = [];

    for (const tableName of tableNames) {
      try {
        const tableData = await this.getTableData(tableName);
        tablesData.push(tableData);
      } catch (error) {
        console.error(`Error fetching data for table ${tableName}:`, error);
        tablesData.push({
          name: tableName,
          rows: [],
          columns: [],
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return tablesData;
  }

  async getTableData(tableName: string) {
    let tableSchema;
    let rows: any[] = [];

    switch (tableName) {
      case "users":
        tableSchema = users;
        rows = await db.select().from(users);
        break;
      case "jobs":
        tableSchema = jobs;
        rows = await db.select().from(jobs);
        break;
      case "applications":
        tableSchema = applications;
        rows = await db.select().from(applications);
        break;
      case "employers":
        tableSchema = employers;
        rows = await db.select().from(employers);
        break;
      case "categories":
        tableSchema = categories;
        rows = await db.select().from(categories);
        break;
      case "saved_jobs":
        tableSchema = savedJobs;
        rows = await db.select().from(savedJobs);
        break;
      case "job_alerts":
        tableSchema = jobAlerts;
        rows = await db.select().from(jobAlerts);
        break;
      case "user_sessions":
        tableSchema = userSessions;
        rows = await db.select().from(userSessions);
        break;
      case "sessions":
        // Handle sessions table separately since it may not follow standard schema
        try {
          rows = await db.select().from(sessions);
        } catch (err) {
          // If sessions table doesn't exist or isn't accessible, return empty
          rows = [];
        }
        return {
          name: tableName,
          rows: rows || [],
          columns: rows.length > 0 ? Object.keys(rows[0]) : [],
        };
      default:
        throw new Error(`Unknown table: ${tableName}`);
    }

    // Get column names from the first row if available
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      name: tableName,
      rows,
      columns,
    };
  }

  async getAllApplicationsWithJobs(): Promise<
    Array<Application & { job: Job }>
  > {
    const applicationsWithJobs = await db
      .select({
        // Application fields
        id: applications.id,
        jobId: applications.jobId,
        applicantId: applications.applicantId,
        firstName: applications.firstName,
        middleName: applications.middleName,
        lastName: applications.lastName,
        email: applications.email,
        phone: applications.phone,
        address: applications.address,
        coverLetter: applications.coverLetter,
        resume: applications.resume,
        status: applications.status,
        channelId: applications.channelId,
        notes: applications.notes,
        interviewDate: applications.interviewDate,
        interviewTime: applications.interviewTime,
        interviewVenue: applications.interviewVenue,
        interviewType: applications.interviewType,
        interviewNotes: applications.interviewNotes,
        notProceedingReason: applications.notProceedingReason,
        smsNotificationSent: applications.smsNotificationSent,
        appliedAt: applications.appliedAt,
        updatedAt: applications.updatedAt,
        // Job fields
        job: {
          id: jobs.id,
          title: jobs.title,
          company: jobs.company,
          location: jobs.location,
          type: jobs.type,
          category: jobs.category,
          salary: jobs.salary,
          description: jobs.description,
          requirements: jobs.requirements,
          requiredSkills: jobs.requiredSkills,
          benefits: jobs.benefits,
          email: jobs.email,
          phone: jobs.phone,
          employerId: jobs.employerId,
          isActive: jobs.isActive,
          isFeatured: jobs.isFeatured,
          applicantCount: jobs.applicantCount,
          viewCount: jobs.viewCount,
          expiresAt: jobs.expiresAt,
          postedAt: jobs.postedAt,
          updatedAt: jobs.updatedAt,
        },
      })
      .from(applications)
      .innerJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.appliedAt));

    return applicationsWithJobs.map((app: any) => ({
      id: app.id,
      jobId: app.jobId,
      applicantId: app.applicantId,
      firstName: app.firstName,
      middleName: app.middleName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      address: app.address,
      coverLetter: app.coverLetter,
      resume: app.resume,
      status: app.status,
      channelId: app.channelId,
      notes: app.notes,
      interviewDate: app.interviewDate,
      interviewTime: app.interviewTime,
      interviewVenue: app.interviewVenue,
      interviewType: app.interviewType,
      interviewNotes: app.interviewNotes,
      notProceedingReason: app.notProceedingReason,
      smsNotificationSent: app.smsNotificationSent,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
      job: app.job,
    }));
  }

  async clearAllData(): Promise<void> {
    // Clear in reverse order to handle foreign key constraints
    await db.delete(applications);
    await db.delete(savedJobs);
    await db.delete(jobAlerts);
    await db.delete(jobs);
    await db.delete(categories);
    await db.delete(employers);
    await db.delete(userSessions);
    await db.delete(users);
  }

  async getPendingVerifications(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(eq(users.role, "employer"), eq(users.verificationStatus, "pending"))
      )
      .orderBy(desc(users.updatedAt));
  }

  async getActivityTrends() {
    const trends = [];
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      const [jobsCount] = await db
        .select({ count: count() })
        .from(jobs)
        .where(and(gte(jobs.postedAt, date), lt(jobs.postedAt, nextDay)));

      const [applicationsCount] = await db
        .select({ count: count() })
        .from(applications)
        .where(
          and(
            gte(applications.appliedAt, date),
            lt(applications.appliedAt, nextDay)
          )
        );

      trends.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1],
        jobs: jobsCount.count || 0,
        applications: applicationsCount.count || 0,
      });
    }

    return trends;
  }

  async getInDemandJobs(): Promise<
    Array<{
      title: string;
      totalApplications: number;
      totalPostings: number;
      companiesHiring: number;
    }>
  > {
    const allApplications = await this.getAllApplicationsWithJobs();
    const allJobs = await this.getAllJobs({ includeInactive: true });

    const jobTitleCounts: Record<
      string,
      {
        title: string;
        totalApplications: number;
        totalPostings: number;
        companies: string[];
      }
    > = {};

    allJobs.forEach((job) => {
      const titleKey = job.title.toLowerCase().trim();
      if (!jobTitleCounts[titleKey]) {
        jobTitleCounts[titleKey] = {
          title: job.title,
          totalApplications: 0,
          totalPostings: 0,
          companies: [],
        };
      }
      jobTitleCounts[titleKey].totalPostings++;
      jobTitleCounts[titleKey].totalApplications += job.applicantCount || 0;
      if (!jobTitleCounts[titleKey].companies.includes(job.company)) {
        jobTitleCounts[titleKey].companies.push(job.company);
      }
    });

    return Object.values(jobTitleCounts)
      .map((job) => ({
        title: job.title,
        totalApplications: job.totalApplications,
        totalPostings: job.totalPostings,
        companiesHiring: job.companies.length,
      }))
      .sort((a, b) => b.totalApplications - a.totalApplications)
      .slice(0, 10);
  }

  async getInDemandSkills(): Promise<
    Array<{
      skill: string;
      demandFromEmployers: number;
      availableFromSeekers: number;
      gap: number;
    }>
  > {
    const allJobs = await this.getAllJobs({ includeInactive: true });
    const allUsers = await this.getAllUsers();

    const skillCounts: Record<
      string,
      { fromJobs: number; fromSeekers: number }
    > = {};

    allJobs.forEach((job) => {
      const skills = (job.requiredSkills || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s);
      skills.forEach((skill) => {
        if (!skillCounts[skill]) {
          skillCounts[skill] = { fromJobs: 0, fromSeekers: 0 };
        }
        skillCounts[skill].fromJobs++;
      });
    });

    const jobSeekers = allUsers.filter((u) => u.role === "jobseeker");
    jobSeekers.forEach((seeker) => {
      const skills = (seeker.skills || "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((s) => s);
      skills.forEach((skill) => {
        if (!skillCounts[skill]) {
          skillCounts[skill] = { fromJobs: 0, fromSeekers: 0 };
        }
        skillCounts[skill].fromSeekers++;
      });
    });

    return Object.entries(skillCounts)
      .map(([skill, counts]) => ({
        skill: skill.charAt(0).toUpperCase() + skill.slice(1),
        demandFromEmployers: counts.fromJobs,
        availableFromSeekers: counts.fromSeekers,
        gap: counts.fromJobs - counts.fromSeekers,
      }))
      .sort((a, b) => b.demandFromEmployers - a.demandFromEmployers)
      .slice(0, 15);
  }

  async getSalaryTrends(): Promise<{
    categoryAverages: Array<{
      category: string;
      averageSalary: number;
      minSalary: number;
      maxSalary: number;
      jobCount: number;
    }>;
    monthlyTrends: Array<{
      month: string;
      categories: Array<{ category: string; averageSalary: number }>;
    }>;
  }> {
    const allJobs = await this.getAllJobs({ includeInactive: true });
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const recentJobs = allJobs.filter(
      (job) => new Date(job.postedAt) >= threeMonthsAgo
    );

    const salaryByCategory: Record<
      string,
      { salaries: number[]; count: number }
    > = {};
    const salaryByMonth: Record<
      string,
      Record<string, { total: number; count: number }>
    > = {};

    const parseSalary = (salaryString: string): number => {
      if (!salaryString) return 0;
      const cleanSalary = salaryString.replace(/[^0-9.-]/g, "");
      if (salaryString.includes("-")) {
        const parts = salaryString
          .split("-")
          .map((s) => parseFloat(s.replace(/[^0-9.]/g, "")));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          return (parts[0] + parts[1]) / 2;
        }
      }
      const kMatch = salaryString.match(/(\d+(?:\.\d+)?)\s*k/i);
      if (kMatch) {
        return parseFloat(kMatch[1]) * 1000;
      }
      const parsed = parseFloat(cleanSalary);
      return isNaN(parsed) ? 0 : parsed;
    };

    recentJobs.forEach((job) => {
      const salary = parseSalary(job.salary);
      if (salary > 0) {
        if (!salaryByCategory[job.category]) {
          salaryByCategory[job.category] = { salaries: [], count: 0 };
        }
        salaryByCategory[job.category].salaries.push(salary);
        salaryByCategory[job.category].count++;

        const monthKey = new Date(job.postedAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        if (!salaryByMonth[monthKey]) {
          salaryByMonth[monthKey] = {};
        }
        if (!salaryByMonth[monthKey][job.category]) {
          salaryByMonth[monthKey][job.category] = { total: 0, count: 0 };
        }
        salaryByMonth[monthKey][job.category].total += salary;
        salaryByMonth[monthKey][job.category].count++;
      }
    });

    const categoryAverages = Object.entries(salaryByCategory)
      .map(([category, data]) => ({
        category,
        averageSalary: Math.round(
          data.salaries.reduce((a, b) => a + b, 0) / data.salaries.length
        ),
        minSalary: Math.min(...data.salaries),
        maxSalary: Math.max(...data.salaries),
        jobCount: data.count,
      }))
      .sort((a, b) => b.averageSalary - a.averageSalary);

    const monthlyTrends = Object.entries(salaryByMonth)
      .map(([month, categories]) => ({
        month,
        categories: Object.entries(categories).map(([category, data]) => ({
          category,
          averageSalary: Math.round(data.total / data.count),
        })),
      }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      );

    return { categoryAverages, monthlyTrends };
  }

  async getPesoStats(): Promise<{
    placementRate: number;
    totalApplications: number;
    totalHired: number;
    localEmploymentRate: number;
    totalLocalJobs: number;
    totalJobs: number;
    monthlyStats: Array<{
      month: string;
      applications: number;
      hired: number;
      jobs: number;
      newSeekers: number;
      placementRate: number;
    }>;
    categoryHiring: Array<{
      category: string;
      applications: number;
      hired: number;
      rate: number;
    }>;
  }> {
    try {
    const allApplications = await this.getAllApplicationsWithJobs();
    const allJobs = await this.getAllJobs({ includeInactive: true });
    const allUsers = await this.getAllUsers();

    const totalApplications = allApplications.length;
    const hiredCount = allApplications.filter(
      (app) => app.status === "hired"
    ).length;
    const placementRate =
      totalApplications > 0 ? (hiredCount / totalApplications) * 100 : 0;

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats: Record<
      string,
      { applications: number; hired: number; jobs: number; newSeekers: number }
    > = {};

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      monthlyStats[monthKey] = {
        applications: 0,
        hired: 0,
        jobs: 0,
        newSeekers: 0,
      };
    }

    allApplications.forEach((app) => {
      const appDate = new Date(app.appliedAt);
      if (appDate >= sixMonthsAgo) {
        const monthKey = appDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].applications++;
          if (app.status === "hired") {
            monthlyStats[monthKey].hired++;
          }
        }
      }
    });

    allJobs.forEach((job) => {
      const jobDate = new Date(job.postedAt);
      if (jobDate >= sixMonthsAgo) {
        const monthKey = jobDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].jobs++;
        }
      }
    });

    const jobSeekers = allUsers.filter((u) => u.role === "jobseeker");
    jobSeekers.forEach((seeker) => {
      const regDate = new Date(seeker.createdAt);
      if (regDate >= sixMonthsAgo) {
        const monthKey = regDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        if (monthlyStats[monthKey]) {
          monthlyStats[monthKey].newSeekers++;
        }
      }
    });

    // All jobs in this system are local to Pili since locations are Pili barangays
    // The barangay names (Anayan, Bagong Sirang, San Jose, etc.) are all in Pili, Camarines Sur
    const piliBarangays = [
      "anayan",
      "bagong sirang",
      "binanwaanan",
      "binobong",
      "cadlan",
      "caroyroyan",
      "curry",
      "del rosario",
      "himaao",
      "la purisima",
      "new san roque",
      "old san roque",
      "palestina",
      "pawili",
      "sagrada",
      "sagurong",
      "san agustin",
      "san antonio",
      "san isidro",
      "san jose",
      "san juan",
      "san vicente",
      "santiago",
      "santo niño",
      "tagbong",
      "tinangis",
      "pili",
      "camarines sur",
      "cam sur",
    ];
    const localJobs = allJobs.filter((job) =>
      piliBarangays.some((loc) => job.location.toLowerCase().includes(loc))
    );
    const localEmploymentRate =
      allJobs.length > 0 ? (localJobs.length / allJobs.length) * 100 : 0;

    const categoryHiring: Record<
      string,
      { applications: number; hired: number; rate: number }
    > = {};
    allApplications.forEach((app) => {
      const category = app.job.category;
      if (!categoryHiring[category]) {
        categoryHiring[category] = { applications: 0, hired: 0, rate: 0 };
      }
      categoryHiring[category].applications++;
      if (app.status === "hired") {
        categoryHiring[category].hired++;
      }
    });

    Object.keys(categoryHiring).forEach((cat) => {
      const data = categoryHiring[cat];
      data.rate =
        data.applications > 0
          ? parseFloat(((data.hired / data.applications) * 100).toFixed(1))
          : 0;
    });

    return {
      placementRate: parseFloat(placementRate.toFixed(1)),
      totalApplications,
      totalHired: hiredCount,
      localEmploymentRate: parseFloat(localEmploymentRate.toFixed(1)),
      totalLocalJobs: localJobs.length,
      totalJobs: allJobs.length,
      monthlyStats: Object.entries(monthlyStats).map(([month, data]) => ({
        month,
        ...data,
        placementRate:
          data.applications > 0
            ? parseFloat(((data.hired / data.applications) * 100).toFixed(1))
            : 0,
      })),
      categoryHiring: Object.entries(categoryHiring)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.rate - a.rate),
    };
    } catch (error) {
      console.error("Error in getPesoStats:", error);
      // Return safe defaults when query fails
      return {
        placementRate: 0,
        totalApplications: 0,
        totalHired: 0,
        localEmploymentRate: 0,
        totalLocalJobs: 0,
        totalJobs: 0,
        monthlyStats: [],
        categoryHiring: [],
      };
    }
  }

  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  }

  async getAllApplications(): Promise<
    Array<Application & { jobTitle: string }>
  > {
    return this.getAllApplicationsAdmin();
  }
}

export const storage = new DatabaseStorage();
