import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  sendApplicationConfirmationSMS,
  sendEmployerNotificationSMS,
  sendApplicationStatusUpdateSMS,
  sendEmployerVerificationApprovalSMS,
  sendEmployerVerificationRejectionSMS,
  sendInterviewScheduledSMS,
  sendNotProceedingSMS,
  sendInterviewCompletedSMS,
} from "./textbee.js";
import cookieParser from "cookie-parser";
import { storage } from "./storage.js";
import {
  hashPassword,
  verifyPassword,
  createSession,
  validateSession,
  destroySession,
  requireAuth,
  requireEmployer,
  requireAdmin,
  type AuthenticatedRequest,
} from "./auth.js";
import {
  insertJobSchema,
  insertApplicationSchema,
  insertEmployerSchema,
  insertCategorySchema,
  insertSavedJobSchema,
  insertJobAlertSchema,
  updateApplicationSchema,
  registerUserSchema,
  loginUserSchema,
  type Job,
} from "../../shared/schema.js";
import { z } from "zod";
import * as XLSX from "xlsx";

// Helper function to parse salary strings into numeric values
function parseSalary(salaryString: string): number {
  if (!salaryString) return 0;

  // Remove common formatting characters and extract numbers
  const cleanSalary = salaryString.replace(/[^0-9.-]/g, "");

  // Handle salary ranges (e.g., "15000-25000" or "15,000 - 25,000")
  if (salaryString.includes("-")) {
    const parts = salaryString
      .split("-")
      .map((s) => parseFloat(s.replace(/[^0-9.]/g, "")));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return (parts[0] + parts[1]) / 2; // Return average of range
    }
  }

  // Handle "K" notation (e.g., "25K")
  const kMatch = salaryString.match(/(\d+(?:\.\d+)?)\s*k/i);
  if (kMatch) {
    return parseFloat(kMatch[1]) * 1000;
  }

  const parsed = parseFloat(cleanSalary);
  return isNaN(parsed) ? 0 : parsed;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Middleware
  app.use(cookieParser());

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerUserSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "An account with this email already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.role,
        firstName: validatedData.firstName,
        middleName: validatedData.middleName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
      });

      // Create session
      const sessionToken = await createSession(user.id);
      res.cookie("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Return user without password
      const { passwordHash, ...userResponse } = user;
      res.status(201).json({ user: userResponse });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid registration data",
          errors: error.errors,
        });
      }

      // Handle database constraint errors (both SQLite and PostgreSQL)
      if (error && typeof error === "object") {
        const errorMessage = "message" in error ? (error as Error).message : "";
        const errorCode = "code" in error ? (error as any).code : "";

        // PostgreSQL unique constraint violation (code 23505)
        if (
          errorCode === "23505" ||
          errorMessage.includes("UNIQUE constraint failed") ||
          errorMessage.includes("duplicate key")
        ) {
          if (
            errorMessage.includes("email") ||
            errorMessage.includes("users_email")
          ) {
            return res
              .status(400)
              .json({ message: "An account with this email already exists" });
          }
          if (
            errorMessage.includes("phone") ||
            errorMessage.includes("users_phone")
          ) {
            return res.status(400).json({
              message: "An account with this phone number already exists",
            });
          }
          // Generic unique constraint error
          return res.status(400).json({
            message: "An account with this information already exists",
          });
        }
      }

      console.error("Registration error:", error);
      res
        .status(500)
        .json({ message: "Failed to register user. Please try again." });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginUserSchema.parse(req.body);

      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await verifyPassword(
        validatedData.password,
        user.passwordHash
      );
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      const sessionToken = await createSession(user.id);
      res.cookie("session", sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: "/",
      });

      // Return user without password
      const { passwordHash, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid login data",
          errors: error.errors,
        });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Failed to login" });
    }
  });

  app.post(
    "/api/auth/logout",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const sessionToken = req.cookies.session;
        if (sessionToken) {
          await destroySession(sessionToken);
        }
        res.clearCookie("session", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          path: "/",
        });
        res.json({ message: "Logged out successfully" });
      } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Failed to logout" });
      }
    }
  );

  app.get(
    "/api/auth/me",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = await storage.getUserById(req.user!);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const { passwordHash, ...userResponse } = user;
        res.json({ user: userResponse });
      } catch (error) {
        console.error("Get user error:", error);
        res.status(500).json({ message: "Failed to get user" });
      }
    }
  );

  app.put(
    "/api/auth/profile",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const {
          firstName,
          lastName,
          email,
          phone,
          address,
          skills,
          desiredRoles,
          experienceLevel,
          preferredLocation,
          resume,
          coverLetter,
        } = req.body;

        console.log("Profile update request body:", {
          resume: resume
            ? `${String(resume).substring(0, 50)}...`
            : "undefined",
          coverLetter: coverLetter
            ? `${String(coverLetter).substring(0, 50)}...`
            : "undefined",
          firstName,
          lastName,
          email,
        });

        // Check if email is being changed and if it's already taken by another user
        if (email) {
          const existingUser = await storage.getUserByEmail(email);
          if (existingUser && existingUser.id !== req.user!) {
            return res.status(400).json({ message: "Email already in use" });
          }
        }

        const updatedUser = await storage.updateUser(req.user!, {
          firstName,
          lastName,
          email,
          phone,
          address,
          skills,
          desiredRoles,
          experienceLevel,
          preferredLocation,
          resume,
          coverLetter,
          updatedAt: new Date(),
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const { passwordHash, ...userResponse } = updatedUser;
        res.json({ user: userResponse });
      } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  );

  // Get applications for current job seeker
  app.get(
    "/api/jobseeker/applications",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = await storage.getUserById(req.user!);
        if (!user || user.role === "employer" || user.role === "admin") {
          return res
            .status(403)
            .json({ message: "Access denied - job seeker role required" });
        }

        const applications = await storage.getApplicationsByApplicant(
          user.email
        );
        res.json(applications);
      } catch (error) {
        console.error("Get job seeker applications error:", error);
        res.status(500).json({ message: "Failed to fetch applications" });
      }
    }
  );

  // Get all jobs with optional search, filters, and pagination
  app.get("/api/jobs", async (req, res) => {
    try {
      const { q, location, type, category, salary, page, limit, jobTypes } =
        req.query;

      // Parse pagination parameters
      const currentPage = parseInt(page as string) || 1;
      const pageSize = parseInt(limit as string) || 10;
      const offset = (currentPage - 1) * pageSize;

      // Parse jobTypes from comma-separated string
      const jobTypeArray = jobTypes
        ? (jobTypes as string).split(",").filter((t) => t.trim())
        : [];

      // Debug logging
      console.log("Search parameters:", {
        q: q,
        location: location,
        type: type,
        category: category,
        salary: salary,
        jobTypes: jobTypeArray,
      });

      let jobs;
      let totalCount;

      // Check if any filter is applied
      const searchQuery = q ? q.toString().trim() : "";
      const hasFilters =
        searchQuery ||
        (location &&
          location !== "Pili (All Areas)" &&
          location.toString().trim()) ||
        (type && type.toString().trim()) ||
        (category &&
          category !== "All Categories" &&
          category.toString().trim()) ||
        (salary && salary !== "Any Salary" && salary.toString().trim()) ||
        jobTypeArray.length > 0;

      if (hasFilters) {
        // Get total count for search results (without pagination)
        const allSearchResults = await storage.searchJobs(searchQuery, {
          location: location as string,
          type: type as string,
          category: category as string,
          salary: salary as string,
          jobTypes: jobTypeArray,
        });
        totalCount = allSearchResults.length;

        // Get paginated search results
        jobs = await storage.searchJobs(
          searchQuery,
          {
            location: location as string,
            type: type as string,
            category: category as string,
            salary: salary as string,
            jobTypes: jobTypeArray,
          },
          {
            limit: pageSize,
            offset: offset,
          }
        );
      } else {
        // Get all jobs with pagination
        const allJobs = await storage.getAllJobs();
        totalCount = allJobs.length;

        // Apply pagination to all jobs
        jobs = allJobs.slice(offset, offset + pageSize);
      }

      // Check if user is authenticated and is a job seeker
      const sessionToken = req.cookies?.session;
      let userId: number | null = null;
      if (sessionToken) {
        try {
          const userObject = await validateSession(sessionToken);
          if (userObject) {
            userId = userObject.id;
          }
        } catch (error) {
          // Session invalid, continue without user context
        }
      }

      // If authenticated job seeker with complete profile, add match scores and sort
      if (userId) {
        const user = await storage.getUserById(userId);
        if (user && user.role === "jobseeker") {
          const hasCompleteProfile =
            user.skills &&
            user.desiredRoles &&
            user.experienceLevel &&
            user.preferredLocation;

          if (hasCompleteProfile) {
            // Calculate match scores for all jobs
            const jobsWithScores = await Promise.all(
              jobs.map(async (job) => {
                const scores = await storage.calculateJobMatch(userId, job.id);
                return {
                  ...job,
                  matchScore: scores.matchScore,
                  skillMatch: scores.skillMatch,
                  locationMatch: scores.locationMatch,
                  roleMatch: scores.roleMatch,
                };
              })
            );

            // Sort by match score (highest first), then by date for 0% matches
            jobs = jobsWithScores.sort((a, b) => {
              if (b.matchScore !== a.matchScore) {
                return b.matchScore - a.matchScore;
              }
              // For equal match scores (including 0), sort by newest first
              return (
                new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
              );
            });
          }
        }
      }

      // Disable caching for authenticated users to ensure match scores are always fresh
      if (userId) {
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.setHeader("Pragma", "no-cache");
        res.setHeader("Expires", "0");
      }

      res.json({
        jobs,
        pagination: {
          currentPage,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNext: currentPage < Math.ceil(totalCount / pageSize),
          hasPrevious: currentPage > 1,
        },
      });
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Get a specific job
  app.get("/api/jobs/:id", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch job" });
    }
  });

  // Create a new job (employers and admins only)
  app.post(
    "/api/jobs",
    requireEmployer,
    async (req: AuthenticatedRequest, res) => {
      try {
        const validatedData = insertJobSchema.parse(req.body);

        // Set the employerId to the current user's ID if not provided
        if (!validatedData.employerId) {
          validatedData.employerId = req.user!;
        }

        console.log(
          "Creating job with employerId:",
          validatedData.employerId,
          "for user:",
          req.user!
        );
        const job = await storage.createJob(validatedData);
        res.status(201).json(job);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Invalid job data",
            errors: error.errors,
          });
        }
        console.error("Create job error:", error);
        res.status(500).json({ message: "Failed to create job" });
      }
    }
  );

  // Apply for a job
  app.post("/api/jobs/:id/apply", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const job = await storage.getJob(jobId);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const applicationData = {
        ...req.body,
        jobId: jobId,
      };

      const validatedData = insertApplicationSchema.parse(applicationData);
      const application = await storage.createApplication(validatedData);

      // Send SMS confirmation to applicant
      try {
        const smsSuccess = await sendApplicationConfirmationSMS(
          validatedData.phone,
          `${validatedData.firstName} ${validatedData.lastName}`,
          job.title,
          job.company
        );

        if (smsSuccess) {
          // Update application to mark SMS as sent
          await storage.updateApplication(application.id, {
            smsNotificationSent: true,
          });
        }

        // Send notification to employer if phone number is available
        let employerPhone = job.phone;

        // If job doesn't have phone, try to get employer's registered phone
        if (!employerPhone && job.employerId) {
          const employer = await storage.getUserById(job.employerId);
          employerPhone = employer?.phone || null;
        }

        if (employerPhone) {
          await sendEmployerNotificationSMS(
            employerPhone,
            `${validatedData.firstName} ${validatedData.lastName}`,
            job.title
          );
        }
      } catch (smsError) {
        console.error("SMS notification error:", smsError);
        // Don't fail the application submission if SMS fails
      }

      res.status(201).json(application);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Invalid application data",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to submit application" });
    }
  });

  // Get applications for a job
  app.get("/api/jobs/:id/applications", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      const applications = await storage.getApplicationsForJob(jobId);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  // Get enhanced stats for dashboard
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getJobStats();

      // Get actual hired this month count from PESO stats
      const pesoStats = await storage.getPesoStats();
      const currentMonth = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      const currentMonthStats = pesoStats.monthlyStats.find(
        (m) => m.month === currentMonth
      );
      const hiredThisMonth = currentMonthStats?.hired || 0;

      // Convert to expected format with real data
      const formattedStats = {
        activeJobs: stats.activeJobs,
        employers: stats.totalEmployers,
        hiredThisMonth: hiredThisMonth, // Use actual hired count from PESO stats
        jobSeekers: stats.totalJobSeekers, // Use real job seeker count
        totalJobs: stats.totalJobs,
        totalApplications: stats.totalApplications,
        categoriesWithCounts: stats.categoriesWithCounts,
        recentJobs: stats.recentJobs.slice(0, 3), // Only show 3 recent jobs
      };

      res.json(formattedStats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Increment job view count
  app.post("/api/jobs/:id/view", async (req, res) => {
    try {
      const jobId = parseInt(req.params.id);
      await storage.incrementJobViews(jobId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error incrementing job views:", error);
      res.status(500).json({ message: "Failed to update view count" });
    }
  });

  // Get featured jobs
  app.get("/api/jobs/featured", async (req, res) => {
    try {
      const featuredJobs = await storage.getFeaturedJobs();
      res.json(featuredJobs);
    } catch (error) {
      console.error("Error fetching featured jobs:", error);
      res.status(500).json({ message: "Failed to fetch featured jobs" });
    }
  });

  // Seed database (admin only)
  app.post("/api/admin/seed-database", requireAdmin, async (req, res) => {
    try {
      const { seedDatabase } = await import("./seed");
      const result = await seedDatabase();
      res.json(result);
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Get activity trends (admin only)
  app.get("/api/admin/activity-trends", requireAdmin, async (req, res) => {
    try {
      const activityData = await storage.getActivityTrends();
      res.json(activityData);
    } catch (error) {
      console.error("Error fetching activity trends:", error);
      res.status(500).json({ message: "Failed to fetch activity trends" });
    }
  });

  // File upload for resumes with validation
  app.post("/api/upload/resume", async (req, res) => {
    try {
      // Handle JSON with base64 data
      const resumeData = req.body;

      if (!resumeData || typeof resumeData.content !== "string") {
        return res
          .status(400)
          .json({ message: "Invalid resume data - content field required" });
      }

      // Validate file type from base64 header
      const allowedTypes = [
        "data:application/pdf",
        "data:application/msword",
        "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "data:text/plain",
      ];
      const hasValidType = allowedTypes.some((type) =>
        resumeData.content.startsWith(type)
      );

      if (!hasValidType) {
        return res.status(400).json({
          message:
            "Invalid file type. Only PDF, Word documents, and text files are allowed.",
        });
      }

      // Check file size (approximate from base64)
      const base64Data = resumeData.content.split(",")[1] || resumeData.content;
      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (sizeInBytes > maxSize) {
        return res
          .status(400)
          .json({ message: "File too large. Maximum size is 5MB." });
      }

      // Store the complete base64 data URL for later download
      const uniqueId = `resume_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      res.json({
        success: true,
        filePath: resumeData.content, // Store the complete base64 data URL
        fileId: uniqueId,
        message: "Resume uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ message: "Failed to upload resume" });
    }
  });

  // File upload for cover letters with validation
  app.post("/api/upload/cover-letter", async (req, res) => {
    try {
      // Handle JSON with base64 data
      const coverLetterData = req.body;

      if (!coverLetterData || typeof coverLetterData.content !== "string") {
        return res.status(400).json({
          message: "Invalid cover letter data - content field required",
        });
      }

      // Validate file type from base64 header
      const allowedTypes = [
        "data:application/pdf",
        "data:application/msword",
        "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "data:text/plain",
      ];
      const hasValidType = allowedTypes.some((type) =>
        coverLetterData.content.startsWith(type)
      );

      if (!hasValidType) {
        return res.status(400).json({
          message:
            "Invalid file type. Only PDF, Word documents, and text files are allowed.",
        });
      }

      // Check file size (approximate from base64)
      const base64Data =
        coverLetterData.content.split(",")[1] || coverLetterData.content;
      const sizeInBytes = (base64Data.length * 3) / 4;
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (sizeInBytes > maxSize) {
        return res
          .status(400)
          .json({ message: "File too large. Maximum size is 2MB." });
      }

      // Store the complete base64 data URL for later download
      const uniqueId = `cover_letter_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      res.json({
        success: true,
        filePath: coverLetterData.content, // Store the complete base64 data URL
        fileId: uniqueId,
        message: "Cover letter uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading cover letter:", error);
      res.status(500).json({ message: "Failed to upload cover letter" });
    }
  });

  // Download resume endpoint
  app.get("/api/download/resume/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const application = await storage.getApplicationById(applicationId);

      if (!application || !application.resume) {
        return res.status(404).json({ message: "Resume not found" });
      }

      // Check if resume is a base64 data URL
      if (application.resume.startsWith("data:")) {
        const mimeMatch = application.resume.match(/data:([^;]+);base64,(.+)/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          const base64Data = mimeMatch[2];
          const buffer = Buffer.from(base64Data, "base64");

          // Set appropriate headers
          let extension = ".pdf";
          if (mimeType === "application/msword") {
            extension = ".doc";
          } else if (
            mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) {
            extension = ".docx";
          } else if (mimeType === "text/plain") {
            extension = ".txt";
          }

          const fileName = `${application.firstName}_${application.lastName}_resume${extension}`;

          res.setHeader("Content-Type", mimeType);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
          );
          res.setHeader("Content-Length", buffer.length);

          return res.send(buffer);
        }
      }

      // Fallback for old text-based resume storage
      res.setHeader("Content-Type", "text/plain");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${application.firstName}_${application.lastName}_resume.txt"`
      );
      res.send(application.resume);
    } catch (error) {
      console.error("Error downloading resume:", error);
      res.status(500).json({ message: "Failed to download resume" });
    }
  });

  // Download cover letter endpoint
  app.get("/api/download/cover-letter/:applicationId", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.applicationId);
      const application = await storage.getApplicationById(applicationId);

      if (!application || !application.coverLetter) {
        return res.status(404).json({ message: "Cover letter not found" });
      }

      // Check if cover letter is a base64 data URL (file upload)
      if (application.coverLetter.startsWith("data:")) {
        const mimeMatch = application.coverLetter.match(
          /data:([^;]+);base64,(.+)/
        );
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          const base64Data = mimeMatch[2];
          const buffer = Buffer.from(base64Data, "base64");

          // Set appropriate headers
          let extension = ".pdf";
          if (mimeType === "application/msword") {
            extension = ".doc";
          } else if (
            mimeType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ) {
            extension = ".docx";
          } else if (mimeType === "text/plain") {
            extension = ".txt";
          }

          const fileName = `${application.firstName}_${application.lastName}_cover_letter${extension}`;

          res.setHeader("Content-Type", mimeType);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${fileName}"`
          );
          res.setHeader("Content-Length", buffer.length);

          return res.send(buffer);
        }
      }

      // Fallback for text-based cover letter storage
      res.setHeader("Content-Type", "text/plain");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${application.firstName}_${application.lastName}_cover_letter.txt"`
      );
      res.send(application.coverLetter);
    } catch (error) {
      console.error("Error downloading cover letter:", error);
      res.status(500).json({ message: "Failed to download cover letter" });
    }
  });

  // Get job seeker applications - properly filtered by authenticated user
  app.get(
    "/api/jobseeker/applications",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = await storage.getUserById(req.user!);
        if (!user || user.role !== "jobseeker") {
          return res
            .status(403)
            .json({ message: "Access denied - job seeker role required" });
        }

        const applications = await storage.getApplicationsByApplicant(
          user.email
        );
        res.json(applications);
      } catch (error) {
        console.error("Error fetching job seeker applications:", error);
        res.status(500).json({ message: "Failed to fetch applications" });
      }
    }
  );

  // Update application status (for employers)
  app.patch("/api/applications/:id", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const {
        status,
        notes,
        requiredDocuments,
        interviewDate,
        interviewTime,
        interviewVenue,
        interviewType,
        interviewNotes,
        notProceedingReason,
      } = req.body;

      // Get the current application to access applicant and job details
      const currentApplication = await storage.getApplicationById(
        applicationId
      );
      if (!currentApplication) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Get job details for the notification
      const job = await storage.getJob(currentApplication.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Build update object
      const updateData: any = {
        status,
        notes,
        updatedAt: new Date(),
      };

      // Add required documents if requesting additional docs
      if (status === "additional_docs_required" && requiredDocuments) {
        updateData.requiredDocuments = JSON.stringify(requiredDocuments);
      }

      // Add interview fields if scheduling interview
      if (
        status === "interview_scheduled" &&
        interviewDate &&
        interviewTime &&
        interviewVenue &&
        interviewType
      ) {
        updateData.interviewDate = new Date(interviewDate);
        updateData.interviewTime = interviewTime;
        updateData.interviewVenue = interviewVenue;
        updateData.interviewType = interviewType;
        updateData.interviewNotes = interviewNotes || null;
      }

      // Add not proceeding reason if applicable
      if (status === "not_proceeding" && notProceedingReason) {
        updateData.notProceedingReason = notProceedingReason;
      }

      const updatedApplication = await storage.updateApplication(
        applicationId,
        updateData
      );

      // Send appropriate SMS notification based on status
      if (updatedApplication && currentApplication.phone) {
        try {
          const applicantName = `${currentApplication.firstName} ${currentApplication.lastName}`;

          if (status === "additional_docs_required") {
            // Send additional documents required SMS
            await sendApplicationStatusUpdateSMS(
              currentApplication.phone,
              applicantName,
              job.title,
              job.company,
              "Additional documents required - please log in to your account to submit them"
            );
          } else if (
            status === "interview_scheduled" &&
            interviewDate &&
            interviewTime &&
            interviewVenue &&
            interviewType
          ) {
            // Send interview scheduled SMS
            const formattedDate = new Date(interviewDate).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            );
            await sendInterviewScheduledSMS(
              currentApplication.phone,
              applicantName,
              job.title,
              job.company,
              formattedDate,
              interviewTime,
              interviewVenue,
              interviewType,
              interviewNotes
            );
          } else if (status === "interview_completed") {
            // Send interview completed SMS
            await sendInterviewCompletedSMS(
              currentApplication.phone,
              applicantName,
              job.title,
              job.company
            );
          } else if (status === "not_proceeding" && notProceedingReason) {
            // Send not proceeding SMS with reason
            await sendNotProceedingSMS(
              currentApplication.phone,
              applicantName,
              job.title,
              job.company,
              notProceedingReason
            );
          } else if (status === "hired" || status === "reviewed") {
            // Send general status update SMS
            await sendApplicationStatusUpdateSMS(
              currentApplication.phone,
              applicantName,
              job.title,
              job.company,
              status
            );
          }
        } catch (smsError) {
          console.error("SMS notification error:", smsError);
          // Don't fail the status update if SMS fails
        }
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application:", error);
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Update application documents (for job seekers submitting docs)
  app.post("/api/applications/:id/documents", async (req, res) => {
    try {
      const applicationId = parseInt(req.params.id);
      const { submittedDocuments } = req.body;

      if (!submittedDocuments || typeof submittedDocuments !== "object") {
        return res.status(400).json({ message: "Invalid documents data" });
      }

      // Get current application
      const currentApplication = await storage.getApplicationById(
        applicationId
      );
      if (!currentApplication) {
        return res.status(404).json({ message: "Application not found" });
      }

      // Get job for notification
      const job = await storage.getJob(currentApplication.jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Get employer for notification
      const employer = await storage.getUserById(job.employerId!);
      if (!employer) {
        return res.status(404).json({ message: "Employer not found" });
      }

      // Update application with submitted documents and change status to additional_docs_required pending review
      // For now, we'll keep it at additional_docs_required status
      const updatedApplication = await storage.updateApplication(
        applicationId,
        {
          submittedDocuments: JSON.stringify(submittedDocuments),
          updatedAt: new Date(),
        }
      );

      // Send SMS notification to employer that documents have been submitted
      if (employer.phone) {
        try {
          const applicantName = `${currentApplication.firstName} ${currentApplication.lastName}`;
          await sendApplicationStatusUpdateSMS(
            employer.phone,
            applicantName,
            job.title,
            job.company,
            "Documents Submitted"
          );
        } catch (smsError) {
          console.error("SMS notification error for employer:", smsError);
          // Don't fail if SMS fails
        }
      }

      res.json(updatedApplication);
    } catch (error) {
      console.error("Error updating application documents:", error);
      res.status(500).json({ message: "Failed to submit documents" });
    }
  });

  // Update job posting (for employers)
  app.patch(
    "/api/jobs/:id",
    requireEmployer,
    async (req: AuthenticatedRequest, res) => {
      try {
        const jobId = parseInt(req.params.id);
        const jobData = req.body;

        // Verify the job belongs to the current employer
        const existingJob = await storage.getJob(jobId);
        if (!existingJob) {
          return res.status(404).json({ message: "Job not found" });
        }

        const user = await storage.getUserById(req.user!);
        if (existingJob.employerId !== req.user! && user?.role !== "admin") {
          return res
            .status(403)
            .json({ message: "Not authorized to update this job" });
        }

        const updatedJob = await storage.updateJob(jobId, {
          ...jobData,
          updatedAt: new Date(),
        });

        res.json(updatedJob);
      } catch (error) {
        console.error("Error updating job:", error);
        res.status(500).json({ message: "Failed to update job" });
      }
    }
  );

  // Delete a job posting (for employers)
  app.delete(
    "/api/jobs/:id",
    requireEmployer,
    async (req: AuthenticatedRequest, res) => {
      try {
        const jobId = parseInt(req.params.id);

        // Verify the job belongs to the current employer
        const existingJob = await storage.getJob(jobId);
        if (!existingJob) {
          return res.status(404).json({ message: "Job not found" });
        }

        const user = await storage.getUserById(req.user!);
        if (existingJob.employerId !== req.user! && user?.role !== "admin") {
          return res
            .status(403)
            .json({ message: "Not authorized to delete this job" });
        }

        const success = await storage.deleteJob(jobId);
        if (!success) {
          return res.status(500).json({ message: "Failed to delete job" });
        }

        res.json({ message: "Job deleted successfully" });
      } catch (error) {
        console.error("Error deleting job:", error);
        res.status(500).json({ message: "Failed to delete job" });
      }
    }
  );

  // Job Matching Routes
  app.post(
    "/api/jobseeker/match-feedback",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { jobId, feedback } = req.body;

        if (
          !jobId ||
          !feedback ||
          !["thumbs_up", "thumbs_down"].includes(feedback)
        ) {
          return res.status(400).json({ message: "Invalid request" });
        }

        await storage.updateMatchFeedback(req.user!, jobId, feedback);
        res.json({ message: "Feedback recorded" });
      } catch (error) {
        console.error("Error recording feedback:", error);
        res.status(500).json({ message: "Failed to record feedback" });
      }
    }
  );

  // Get job recommendations for job seekers
  app.get(
    "/api/jobseeker/recommendations",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = await storage.getUserById(req.user!);
        if (!user || user.role !== "jobseeker") {
          return res
            .status(403)
            .json({ message: "Access denied - job seeker role required" });
        }

        console.log("Fetching recommendations for user:", user.id, user.email);
        console.log("User profile:", {
          skills: user.skills,
          desiredRoles: user.desiredRoles,
          experienceLevel: user.experienceLevel,
          preferredLocation: user.preferredLocation,
        });

        // Check if user has required profile data
        if (
          !user.skills ||
          !user.desiredRoles ||
          !user.experienceLevel ||
          !user.preferredLocation
        ) {
          console.log(
            "User profile incomplete, returning empty recommendations"
          );
          return res.json([]);
        }

        const recommendations = await storage.getJobRecommendations(user.id);
        console.log(`Returning ${recommendations.length} recommendations`);
        res.json(recommendations);
      } catch (error) {
        console.error("Error fetching job recommendations:", error);
        res.status(500).json({ message: "Failed to fetch recommendations" });
      }
    }
  );

  // Employer scouting - find job seekers by skills
  app.post(
    "/api/employer/scout-candidates",
    requireEmployer,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { skills, experienceLevel, location } = req.body;

        if (!skills || !Array.isArray(skills) || skills.length === 0) {
          return res
            .status(400)
            .json({ message: "At least one skill is required" });
        }

        const candidates = await storage.scoutCandidates({
          skills,
          experienceLevel,
          location,
        });

        res.json(candidates);
      } catch (error) {
        console.error("Error scouting candidates:", error);
        res.status(500).json({ message: "Failed to scout candidates" });
      }
    }
  );

  // Employer-specific routes
  app.get(
    "/api/employer/jobs",
    requireEmployer,
    async (req: AuthenticatedRequest, res) => {
      try {
        const employerId = req.user!;
        console.log("Fetching jobs for employerId:", employerId);
        const employerJobs = await storage.getJobsByEmployer(employerId);
        console.log(
          `Found ${employerJobs.length} jobs for employer ${employerId}`
        );
        res.json(employerJobs);
      } catch (error) {
        console.error("Error fetching employer jobs:", error);
        res.status(500).json({ message: "Failed to fetch employer jobs" });
      }
    }
  );

  app.get(
    "/api/employer/applications",
    requireEmployer,
    async (req: AuthenticatedRequest, res) => {
      try {
        const employerId = req.user!;
        console.log("Fetching applications for employerId:", employerId);
        const applications = await storage.getApplicationsByEmployer(
          employerId
        );
        console.log(
          `Found ${applications.length} applications for employer ${employerId}`
        );
        res.json(applications);
      } catch (error) {
        console.error("Error fetching employer applications:", error);
        res.status(500).json({ message: "Failed to fetch applications" });
      }
    }
  );

  // Get jobs by category
  app.get("/api/jobs/category/:category", async (req, res) => {
    try {
      const category = req.params.category;
      const jobs = await storage.getJobsByCategory(category);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs by category:", error);
      res.status(500).json({ message: "Failed to fetch jobs by category" });
    }
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Admin routes (requires admin role)
  app.get(
    "/api/admin/stats",
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        const stats = await storage.getAdminStats();
        res.json(stats);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Failed to fetch admin stats" });
      }
    }
  );

  app.get(
    "/api/admin/export-analytics",
    requireAdmin,
    async (req: AuthenticatedRequest, res) => {
      try {
        console.log("Starting analytics export...");

        // Fetch all required data
        console.log("Fetching data...");
        const [
          stats,
          categoryStats,
          jobTypeStats,
          trends,
          users,
          jobs,
          applications,
          inDemandJobs,
          inDemandSkills,
          salaryTrends,
          pesoStats,
        ] = await Promise.all([
          storage.getAdminStats(),
          storage.getCategoryStats(),
          storage.getJobTypeStats(),
          storage.getTrends(),
          storage.getUsers(),
          storage.getAllJobs({ includeInactive: true }),
          storage.getAllApplications(),
          storage.getInDemandJobs(),
          storage.getInDemandSkills(),
          storage.getSalaryTrends(),
          storage.getPesoStats(),
        ]);

        console.log("Data fetched successfully");

        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Overview sheet with Key Metrics visualization data
        const overviewData = [
          ["PILI JOBS ANALYTICS DASHBOARD - OVERVIEW"],
          [""],
          ["=== KEY METRICS ==="],
          ["Metric", "Value", "Daily Change"],
          [
            "Total Users",
            stats?.totalUsers || 0,
            `+${stats?.usersRegisteredToday || 0} today`,
          ],
          ["Total Employers", stats?.totalEmployers || 0, ""],
          ["Total Job Seekers", stats?.totalJobSeekers || 0, ""],
          ["Total Jobs", stats?.totalJobs || 0, ""],
          [
            "Active Jobs",
            stats?.activeJobs || 0,
            `+${stats?.jobsPostedToday || 0} today`,
          ],
          ["Featured Jobs", stats?.featuredJobs || 0, ""],
          [
            "Total Applications",
            stats?.totalApplications || 0,
            `+${stats?.applicationsToday || 0} today`,
          ],
          ["Pending Applications", stats?.pendingApplications || 0, ""],
          ["Job Views Today", stats?.jobViewsToday || 0, ""],
          [""],
          ["=== PESO STATISTICS ==="],
          [
            "Placement Rate",
            `${pesoStats?.placementRate || 0}%`,
            `${pesoStats?.totalHired || 0} hired / ${
              pesoStats?.totalApplications || 0
            } applications`,
          ],
          [
            "Local Employment Rate",
            `${pesoStats?.localEmploymentRate || 0}%`,
            `${pesoStats?.totalLocalJobs || 0} local / ${
              pesoStats?.totalJobs || 0
            } total jobs`,
          ],
          [
            "Total Hired",
            pesoStats?.totalHired || 0,
            "Successfully placed job seekers",
          ],
          [
            "Active Job Seekers",
            stats?.totalJobSeekers || 0,
            "Registered on platform",
          ],
        ];
        const overviewSheet = XLSX.utils.aoa_to_sheet(overviewData);
        // Set column widths
        overviewSheet["!cols"] = [{ wch: 30 }, { wch: 15 }, { wch: 40 }];
        XLSX.utils.book_append_sheet(
          workbook,
          overviewSheet,
          "Dashboard Overview"
        );

        // Jobs by Category (Bar Chart Data)
        const categoryData = [
          ["JOBS BY CATEGORY - BAR CHART DATA"],
          [""],
          ["Category", "Job Count", "Application Count", "Avg Salary"],
          ...(categoryStats || []).map((c: any) => [
            c.category,
            c.jobCount,
            c.applicationCount,
            c.avgSalary,
          ]),
        ];
        const categorySheet = XLSX.utils.aoa_to_sheet(categoryData);
        categorySheet["!cols"] = [
          { wch: 20 },
          { wch: 12 },
          { wch: 18 },
          { wch: 15 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          categorySheet,
          "Jobs by Category"
        );

        // Job Types (Pie Chart Data)
        const jobTypeData = [
          ["JOB TYPES DISTRIBUTION - PIE CHART DATA"],
          [""],
          ["Employment Type", "Count", "Percentage"],
          ...(jobTypeStats || []).map((t: any) => [
            t.type,
            t.count,
            t.percentage,
          ]),
          [""],
          [
            "TOTAL",
            (jobTypeStats || []).reduce((sum: any, t: any) => sum + t.count, 0),
            "100%",
          ],
        ];
        const jobTypeSheet = XLSX.utils.aoa_to_sheet(jobTypeData);
        jobTypeSheet["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }];
        XLSX.utils.book_append_sheet(
          workbook,
          jobTypeSheet,
          "Job Types Distribution"
        );

        // Activity Trends (Area Chart Data)
        const validTrends = (trends || []).filter((t) => t.date !== "No Data");
        const trendsData = [
          ["ACTIVITY TRENDS - AREA CHART DATA (Last 7 Days)"],
          [""],
          ["Date", "Applications", "Jobs Posted", "User Registrations"],
          ...validTrends.map((t) => [
            t.date,
            t.applications,
            t.jobs,
            t.users || 0,
          ]),
          [""],
          [
            "TOTALS",
            validTrends.reduce((sum, t) => sum + t.applications, 0),
            validTrends.reduce((sum, t) => sum + t.jobs, 0),
            validTrends.reduce((sum, t) => sum + (t.users || 0), 0),
          ],
        ];
        const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData);
        trendsSheet["!cols"] = [
          { wch: 15 },
          { wch: 15 },
          { wch: 15 },
          { wch: 20 },
        ];
        XLSX.utils.book_append_sheet(workbook, trendsSheet, "Activity Trends");

        // Detailed Users sheet with all fields
        const detailedUsersData = [
          ["DETAILED USERS DATABASE"],
          [""],
          [
            "ID",
            "First Name",
            "Last Name",
            "Email",
            "Phone",
            "Role",
            "Address",
            "Skills",
            "Desired Roles",
            "Experience Level",
            "Preferred Location",
            "Verification Status",
            "Status",
            "Created Date",
            "Updated Date",
          ],
          ...(users || []).map((u) => [
            u.id,
            u.firstName || "N/A",
            u.lastName || "N/A",
            u.email,
            u.phone || "N/A",
            u.role,
            u.address || "N/A",
            u.skills || "N/A",
            u.desiredRoles || "N/A",
            u.experienceLevel || "N/A",
            u.preferredLocation || "N/A",
            u.verificationStatus || "N/A",
            u.isActive ? "Active" : "Inactive",
            new Date(u.createdAt).toLocaleString(),
            new Date(u.updatedAt).toLocaleString(),
          ]),
        ];
        const detailedUsersSheet = XLSX.utils.aoa_to_sheet(detailedUsersData);
        detailedUsersSheet["!cols"] = [
          { wch: 5 },
          { wch: 15 },
          { wch: 15 },
          { wch: 25 },
          { wch: 15 },
          { wch: 12 },
          { wch: 30 },
          { wch: 30 },
          { wch: 30 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
          { wch: 10 },
          { wch: 20 },
          { wch: 20 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          detailedUsersSheet,
          "Detailed Users"
        );

        // Detailed Jobs sheet with all fields
        const detailedJobsData = [
          ["DETAILED JOBS DATABASE"],
          [""],
          [
            "ID",
            "Title",
            "Company",
            "Category",
            "Type",
            "Location",
            "Salary",
            "Description",
            "Requirements",
            "Required Skills",
            "Benefits",
            "Email",
            "Phone",
            "Employer ID",
            "Applications",
            "Views",
            "Featured",
            "Status",
            "Posted Date",
            "Updated Date",
            "Expires At",
          ],
          ...(jobs || []).map((j) => [
            j.id,
            j.title,
            j.company,
            j.category,
            j.type,
            j.location,
            j.salary,
            (j.description || "").substring(0, 200) + "...",
            (j.requirements || "").substring(0, 200) + "...",
            j.requiredSkills || "N/A",
            (j.benefits || "").substring(0, 200) + "...",
            j.email || "N/A",
            j.phone || "N/A",
            j.employerId,
            j.applicantCount || 0,
            j.viewCount || 0,
            j.isFeatured ? "Yes" : "No",
            j.isActive ? "Active" : "Inactive",
            new Date(j.postedAt).toLocaleString(),
            new Date(j.updatedAt).toLocaleString(),
            j.expiresAt ? new Date(j.expiresAt).toLocaleString() : "N/A",
          ]),
        ];
        const detailedJobsSheet = XLSX.utils.aoa_to_sheet(detailedJobsData);
        detailedJobsSheet["!cols"] = [
          { wch: 5 },
          { wch: 30 },
          { wch: 20 },
          { wch: 15 },
          { wch: 12 },
          { wch: 20 },
          { wch: 15 },
          { wch: 50 },
          { wch: 50 },
          { wch: 30 },
          { wch: 50 },
          { wch: 25 },
          { wch: 15 },
          { wch: 10 },
          { wch: 12 },
          { wch: 10 },
          { wch: 10 },
          { wch: 10 },
          { wch: 20 },
          { wch: 20 },
          { wch: 20 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          detailedJobsSheet,
          "Detailed Jobs"
        );

        // Detailed Applications sheet with all fields
        const detailedApplicationsData = [
          ["DETAILED APPLICATIONS DATABASE"],
          [""],
          [
            "ID",
            "Job ID",
            "Job Title",
            "Applicant ID",
            "First Name",
            "Last Name",
            "Email",
            "Phone",
            "Address",
            "Status",
            "Notes",
            "SMS Sent",
            "Applied Date",
            "Updated Date",
          ],
          ...(applications || []).map((a) => [
            a.id,
            a.jobId,
            a.jobTitle || "N/A",
            a.applicantId || "N/A",
            a.firstName,
            a.lastName,
            a.email,
            a.phone,
            a.address || "N/A",
            a.status,
            a.notes || "N/A",
            a.smsNotificationSent ? "Yes" : "No",
            new Date(a.appliedAt).toLocaleString(),
            new Date(a.updatedAt).toLocaleString(),
          ]),
        ];
        const detailedApplicationsSheet = XLSX.utils.aoa_to_sheet(
          detailedApplicationsData
        );
        detailedApplicationsSheet["!cols"] = [
          { wch: 5 },
          { wch: 8 },
          { wch: 30 },
          { wch: 12 },
          { wch: 12 },
          { wch: 12 },
          { wch: 25 },
          { wch: 15 },
          { wch: 30 },
          { wch: 12 },
          { wch: 40 },
          { wch: 10 },
          { wch: 20 },
          { wch: 20 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          detailedApplicationsSheet,
          "Detailed Applications"
        );

        // Job Seekers Only sheet
        const jobSeekers = users.filter((u) => u.role === "jobseeker");
        const jobSeekersData = [
          ["JOB SEEKERS DATABASE"],
          [""],
          [
            "ID",
            "Name",
            "Email",
            "Phone",
            "Address",
            "Skills",
            "Desired Roles",
            "Experience",
            "Location Preference",
            "Status",
            "Registered",
          ],
          ...jobSeekers.map((u) => [
            u.id,
            `${u.firstName || ""} ${u.lastName || ""}`.trim(),
            u.email,
            u.phone || "N/A",
            u.address || "N/A",
            u.skills || "N/A",
            u.desiredRoles || "N/A",
            u.experienceLevel || "N/A",
            u.preferredLocation || "N/A",
            u.isActive ? "Active" : "Inactive",
            new Date(u.createdAt).toLocaleDateString(),
          ]),
        ];
        const jobSeekersSheet = XLSX.utils.aoa_to_sheet(jobSeekersData);
        jobSeekersSheet["!cols"] = [
          { wch: 5 },
          { wch: 25 },
          { wch: 25 },
          { wch: 15 },
          { wch: 30 },
          { wch: 30 },
          { wch: 30 },
          { wch: 15 },
          { wch: 20 },
          { wch: 10 },
          { wch: 15 },
        ];
        XLSX.utils.book_append_sheet(workbook, jobSeekersSheet, "Job Seekers");

        // Employers Only sheet
        const employers = users.filter((u) => u.role === "employer");
        const employersData = [
          ["EMPLOYER DATABASE"],
          [""],
          [
            "ID",
            "Name",
            "Email",
            "Phone",
            "Verification Status",
            "Jobs Posted",
            "Status",
            "Registered",
          ],
          ...employers.map((u) => {
            const employerJobs = jobs.filter((j) => j.employerId === u.id);
            return [
              u.id,
              `${u.firstName || ""} ${u.lastName || ""}`.trim() || "N/A",
              u.email,
              u.phone || "N/A",
              u.verificationStatus || "N/A",
              employerJobs.length,
              u.isActive ? "Active" : "Inactive",
              new Date(u.createdAt).toLocaleDateString(),
            ];
          }),
        ];
        const employersSheet = XLSX.utils.aoa_to_sheet(employersData);
        employersSheet["!cols"] = [
          { wch: 5 },
          { wch: 25 },
          { wch: 25 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
          { wch: 10 },
          { wch: 15 },
        ];
        XLSX.utils.book_append_sheet(workbook, employersSheet, "Employers");

        // Application Status Summary
        const statusCounts = applications.reduce((acc, app) => {
          acc[app.status] = (acc[app.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const statusData = [
          ["APPLICATION STATUS SUMMARY"],
          [""],
          ["Status", "Count"],
          ...Object.entries(statusCounts).map(([status, count]) => [
            status,
            count,
          ]),
        ];
        const statusSheet = XLSX.utils.aoa_to_sheet(statusData);
        statusSheet["!cols"] = [{ wch: 20 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(
          workbook,
          statusSheet,
          "Application Status"
        );

        // Active Jobs by Employer (Bar Chart Data)
        const activeJobsByEmployer = jobs
          .filter((j) => j.isActive)
          .reduce((acc, job) => {
            const employer = users.find((u) => u.id === job.employerId);
            const employerName = employer
              ? `${employer.firstName || ""} ${
                  employer.lastName || ""
                }`.trim() || employer.email
              : "Unknown";
            if (!acc[employerName]) {
              acc[employerName] = { count: 0, applications: 0, views: 0 };
            }
            acc[employerName].count++;
            acc[employerName].applications += job.applicantCount || 0;
            acc[employerName].views += job.viewCount || 0;
            return acc;
          }, {} as Record<string, { count: number; applications: number; views: number }>);

        const employerJobsData = [
          ["ACTIVE JOBS BY EMPLOYER - BAR CHART DATA"],
          [""],
          [
            "Employer",
            "Active Jobs",
            "Total Applications",
            "Total Views",
            "Avg Apps per Job",
          ],
          ...Object.entries(activeJobsByEmployer).map(([employer, data]) => [
            employer,
            data.count,
            data.applications,
            data.views,
            data.count > 0 ? (data.applications / data.count).toFixed(1) : 0,
          ]),
        ];
        const employerJobsSheet = XLSX.utils.aoa_to_sheet(employerJobsData);
        employerJobsSheet["!cols"] = [
          { wch: 30 },
          { wch: 15 },
          { wch: 20 },
          { wch: 15 },
          { wch: 18 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          employerJobsSheet,
          "Jobs by Employer"
        );

        // In-Demand Jobs (Bar Chart Data)
        const inDemandJobsData = [
          ["MOST IN-DEMAND JOBS - BAR CHART DATA"],
          [""],
          ["Job Title", "Applications", "Postings", "Companies Hiring"],
          ...(inDemandJobs || []).map((job) => [
            job.title,
            job.totalApplications,
            job.totalPostings,
            job.companiesHiring,
          ]),
        ];
        const inDemandJobsSheet = XLSX.utils.aoa_to_sheet(inDemandJobsData);
        inDemandJobsSheet["!cols"] = [
          { wch: 35 },
          { wch: 15 },
          { wch: 10 },
          { wch: 18 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          inDemandJobsSheet,
          "In-Demand Jobs"
        );

        // In-Demand Skills (Bar Chart Data)
        const inDemandSkillsData = [
          ["IN-DEMAND SKILLS ANALYSIS - BAR CHART DATA"],
          [""],
          ["Skill", "Employer Demand", "Seeker Availability", "Gap"],
          ...(inDemandSkills || []).map((skill) => [
            skill.skill,
            skill.demandFromEmployers,
            skill.availableFromSeekers,
            skill.gap,
          ]),
        ];
        const inDemandSkillsSheet = XLSX.utils.aoa_to_sheet(inDemandSkillsData);
        inDemandSkillsSheet["!cols"] = [
          { wch: 20 },
          { wch: 18 },
          { wch: 20 },
          { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          inDemandSkillsSheet,
          "In-Demand Skills"
        );

        // Salary Trends - Category Averages (Bar Chart Data)
        const salaryCategoryData = [
          ["SALARY TRENDS BY CATEGORY - BAR CHART DATA"],
          [""],
          [
            "Category",
            "Average Salary",
            "Min Salary",
            "Max Salary",
            "Job Count",
          ],
          ...(salaryTrends?.categoryAverages || []).map((avg) => [
            avg.category,
            avg.averageSalary,
            avg.minSalary,
            avg.maxSalary,
            avg.jobCount,
          ]),
        ];
        const salaryCategorySheet = XLSX.utils.aoa_to_sheet(salaryCategoryData);
        salaryCategorySheet["!cols"] = [
          { wch: 20 },
          { wch: 15 },
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          salaryCategorySheet,
          "Salary Trends (Category)"
        );

        // Salary Trends - Monthly Averages (Line/Area Chart Data)
        const salaryMonthlyData = [
          ["SALARY TRENDS BY MONTH - LINE CHART DATA"],
          [""],
          ["Month", "Category", "Average Salary"],
          ...(salaryTrends?.monthlyTrends || []).flatMap((trend) =>
            trend.categories.map((cat) => [
              trend.month,
              cat.category,
              cat.averageSalary,
            ])
          ),
        ];
        const salaryMonthlySheet = XLSX.utils.aoa_to_sheet(salaryMonthlyData);
        salaryMonthlySheet["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(
          workbook,
          salaryMonthlySheet,
          "Salary Trends (Monthly)"
        );

        // PESO Stats Summary
        const pesoSummaryData = [
          ["PESO EMPLOYMENT STATISTICS SUMMARY"],
          [""],
          ["Metric", "Value", "Details"],
          [
            "Placement Rate",
            `${pesoStats?.placementRate.toFixed(1)}%`,
            `${pesoStats?.totalHired} hired / ${pesoStats?.totalApplications} applications`,
          ],
          [
            "Local Employment Rate",
            `${pesoStats?.localEmploymentRate.toFixed(1)}%`,
            `${pesoStats?.totalLocalJobs} local jobs / ${pesoStats?.totalJobs} total jobs`,
          ],
          ["Total Hired", pesoStats?.totalHired, "Overall job placements"],
          ["Total Jobs Posted", pesoStats?.totalJobs, "All jobs listed"],
          [
            "Total Applications Received",
            pesoStats?.totalApplications,
            "Overall applications",
          ],
          [
            "Total Local Jobs",
            pesoStats?.totalLocalJobs,
            "Jobs located in Pili/CamSur",
          ],
        ];
        const pesoSummarySheet = XLSX.utils.aoa_to_sheet(pesoSummaryData);
        pesoSummarySheet["!cols"] = [{ wch: 25 }, { wch: 12 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(
          workbook,
          pesoSummarySheet,
          "PESO Stats Summary"
        );

        // PESO Monthly Stats (Bar Chart Data)
        const pesoMonthlyData = [
          ["PESO MONTHLY EMPLOYMENT TRENDS - BAR CHART DATA"],
          [""],
          [
            "Month",
            "Applications",
            "Hired",
            "Jobs Posted",
            "New Seekers",
            "Placement Rate (%)",
          ],
          ...(pesoStats?.monthlyStats || []).map((m) => [
            m.month,
            m.applications,
            m.hired,
            m.jobs,
            m.newSeekers,
            m.placementRate.toFixed(1),
          ]),
        ];
        const pesoMonthlySheet = XLSX.utils.aoa_to_sheet(pesoMonthlyData);
        pesoMonthlySheet["!cols"] = [
          { wch: 12 },
          { wch: 12 },
          { wch: 10 },
          { wch: 15 },
          { wch: 12 },
          { wch: 18 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          pesoMonthlySheet,
          "PESO Monthly Trends"
        );

        // PESO Category Hiring (Bar Chart Data)
        const pesoCategoryData = [
          ["PESO HIRING BY CATEGORY - BAR CHART DATA"],
          [""],
          ["Category", "Applications", "Hired", "Placement Rate (%)"],
          ...(pesoStats?.categoryHiring || []).map((c) => [
            c.category,
            c.applications,
            c.hired,
            c.rate.toFixed(1),
          ]),
        ];
        const pesoCategorySheet = XLSX.utils.aoa_to_sheet(pesoCategoryData);
        pesoCategorySheet["!cols"] = [
          { wch: 25 },
          { wch: 12 },
          { wch: 10 },
          { wch: 20 },
        ];
        XLSX.utils.book_append_sheet(
          workbook,
          pesoCategorySheet,
          "PESO Category Hiring"
        );

        console.log("Generating Excel file...");

        // Generate buffer
        const excelBuffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });

        console.log("Excel file generated successfully");

        // Set headers for download
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=pili-jobs-analytics-${
            new Date().toISOString().split("T")[0]
          }.xlsx`
        );

        res.send(excelBuffer);
      } catch (error) {
        console.error("Error exporting analytics:", error);
        res.status(500).json({
          message: "Failed to export analytics",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  app.get("/api/admin/category-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getCategoryStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  });

  app.get("/api/admin/job-type-stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getJobTypeStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching job type stats:", error);
      res.status(500).json({ message: "Failed to fetch job type stats" });
    }
  });

  app.get("/api/admin/trends", requireAdmin, async (req, res) => {
    try {
      const trends = await storage.getTrends();
      res.json(trends);
    } catch (error) {
      console.error("Error fetching trends:", error);
      res.status(500).json({ message: "Failed to fetch trends" });
    }
  });

  app.get("/api/admin/recent-activity", requireAdmin, async (req, res) => {
    try {
      const activity = await storage.getRecentActivity();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // New Analytics Endpoints

  // Most In-Demand Jobs (by number of applications)
  app.get("/api/admin/in-demand-jobs", requireAdmin, async (req, res) => {
    try {
      const allApplications = await storage.getAllApplicationsWithJobs();
      const allJobs = await storage.getAllJobs({ includeInactive: true });

      // Count applications per job
      const jobApplicationCounts: Record<
        number,
        {
          title: string;
          company: string;
          category: string;
          applications: number;
          postings: number;
        }
      > = {};

      allApplications.forEach((app) => {
        if (!jobApplicationCounts[app.jobId]) {
          jobApplicationCounts[app.jobId] = {
            title: app.job.title,
            company: app.job.company,
            category: app.job.category,
            applications: 0,
            postings: 1,
          };
        }
        jobApplicationCounts[app.jobId].applications++;
      });

      // Also count job postings by title (for jobs with same title)
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

      const inDemandJobs = Object.values(jobTitleCounts)
        .map((job) => ({
          title: job.title,
          totalApplications: job.totalApplications,
          totalPostings: job.totalPostings,
          companiesHiring: job.companies.length,
        }))
        .sort((a, b) => b.totalApplications - a.totalApplications)
        .slice(0, 10);

      res.json(inDemandJobs);
    } catch (error) {
      console.error("Error fetching in-demand jobs:", error);
      res.status(500).json({ message: "Failed to fetch in-demand jobs" });
    }
  });

  // Most In-Demand Skills (from job requirements AND job seeker profiles)
  app.get("/api/admin/in-demand-skills", requireAdmin, async (req, res) => {
    try {
      const allJobs = await storage.getAllJobs({ includeInactive: true });
      const allUsers = await storage.getAllUsers();

      const skillCounts: Record<
        string,
        { fromJobs: number; fromSeekers: number }
      > = {};

      // Extract skills from job requirements
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

      // Extract skills from job seeker profiles
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

      const inDemandSkills = Object.entries(skillCounts)
        .map(([skill, counts]) => ({
          skill: skill.charAt(0).toUpperCase() + skill.slice(1),
          demandFromEmployers: counts.fromJobs,
          availableFromSeekers: counts.fromSeekers,
          gap: counts.fromJobs - counts.fromSeekers,
        }))
        .sort((a, b) => b.demandFromEmployers - a.demandFromEmployers)
        .slice(0, 15);

      res.json(inDemandSkills);
    } catch (error) {
      console.error("Error fetching in-demand skills:", error);
      res.status(500).json({ message: "Failed to fetch in-demand skills" });
    }
  });

  // Salary Trends (last 3 months, per category)
  app.get("/api/admin/salary-trends", requireAdmin, async (req, res) => {
    try {
      const allJobs = await storage.getAllJobs({ includeInactive: true });
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Filter jobs from last 3 months
      const recentJobs = allJobs.filter(
        (job) => new Date(job.postedAt) >= threeMonthsAgo
      );

      // Parse salary and group by category and month
      const salaryByCategory: Record<
        string,
        { salaries: number[]; count: number }
      > = {};
      const salaryByMonth: Record<
        string,
        Record<string, { total: number; count: number }>
      > = {};

      recentJobs.forEach((job) => {
        const salary = parseSalary(job.salary);
        if (salary > 0) {
          // By category
          if (!salaryByCategory[job.category]) {
            salaryByCategory[job.category] = { salaries: [], count: 0 };
          }
          salaryByCategory[job.category].salaries.push(salary);
          salaryByCategory[job.category].count++;

          // By month and category
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

      // Calculate averages by category
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

      // Calculate monthly trends
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

      res.json({ categoryAverages, monthlyTrends });
    } catch (error) {
      console.error("Error fetching salary trends:", error);
      res.status(500).json({ message: "Failed to fetch salary trends" });
    }
  });

  // PESO Statistics (Placement rate, Monthly employment, Local employment rate)
  app.get("/api/admin/peso-stats", requireAdmin, async (req, res) => {
    try {
      const allApplications = await storage.getAllApplicationsWithJobs();
      const allJobs = await storage.getAllJobs({ includeInactive: true });
      const allUsers = await storage.getAllUsers();

      // Placement Rate (hired vs total applications)
      const totalApplications = allApplications.length;
      const hiredCount = allApplications.filter(
        (app) => app.status === "hired"
      ).length;
      const placementRate =
        totalApplications > 0
          ? ((hiredCount / totalApplications) * 100).toFixed(1)
          : "0.0";

      // Monthly Employment Statistics (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyStats: Record<
        string,
        {
          applications: number;
          hired: number;
          jobs: number;
          newSeekers: number;
        }
      > = {};

      // Initialize months
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

      // Count applications and hires per month
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

      // Count jobs posted per month
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

      // Count new job seekers per month
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

      // Local Employment Rate (jobs in Pili area)
      const piliLocations = ["pili", "camarines sur", "cam sur"];
      const localJobs = allJobs.filter((job) =>
        piliLocations.some((loc) => job.location.toLowerCase().includes(loc))
      );
      const localEmploymentRate =
        allJobs.length > 0
          ? ((localJobs.length / allJobs.length) * 100).toFixed(1)
          : "0.0";

      // Category-wise hiring
      const categoryHiring: Record<
        string,
        { applications: number; hired: number; rate: number }
      > = {};

      // Initialize all job categories with zero values
      const allCategories = await storage.getAllCategories();
      allCategories.forEach((cat) => {
        categoryHiring[cat.name] = { applications: 0, hired: 0, rate: 0 };
      });

      // Count applications and hires per category
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

      // Calculate rates and filter out categories with no applications
      const categoryHiringData = Object.entries(categoryHiring)
        .map(([category, data]) => {
          const rate =
            data.applications > 0
              ? parseFloat(((data.hired / data.applications) * 100).toFixed(1))
              : 0;
          return {
            category,
            applications: data.applications,
            hired: data.hired,
            rate,
          };
        })
        .filter((data) => data.applications > 0) // Only show categories with applications
        .sort((a, b) => b.rate - a.rate);

      res.json({
        placementRate: parseFloat(placementRate),
        totalApplications,
        totalHired: hiredCount,
        localEmploymentRate: parseFloat(localEmploymentRate),
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
        categoryHiring: categoryHiringData,
      });
    } catch (error) {
      console.error("Error fetching PESO stats:", error);
      res.status(500).json({ message: "Failed to fetch PESO stats" });
    }
  });

  // Database viewer endpoints
  app.get("/api/admin/database/tables", requireAdmin, async (req, res) => {
    try {
      const tables = await storage.getAllTablesData();
      res.json(tables);
    } catch (error) {
      console.error("Error fetching all tables:", error);
      res.status(500).json({ message: "Failed to fetch tables data" });
    }
  });

  app.get(
    "/api/admin/database/table/:tableName",
    requireAdmin,
    async (req, res) => {
      try {
        const { tableName } = req.params;
        const tableData = await storage.getTableData(tableName);
        res.json(tableData);
      } catch (error) {
        console.error("Error fetching table data:", error);
        res.status(500).json({ message: "Failed to fetch table data" });
      }
    }
  );

  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/jobs", requireAdmin, async (req, res) => {
    try {
      const jobs = await storage.getAllJobs({ includeInactive: true });
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching all jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.get("/api/admin/applications", requireAdmin, async (req, res) => {
    try {
      const applications = await storage.getAllApplicationsAdmin();
      res.json(applications);
    } catch (error) {
      console.error("Error fetching all applications:", error);
      res.status(500).json({ message: "Failed to fetch applications" });
    }
  });

  app.post("/api/admin/clear-data", requireAdmin, async (req, res) => {
    try {
      await storage.clearAllData();
      res.json({ message: "All data cleared successfully" });
    } catch (error) {
      console.error("Error clearing data:", error);
      res.status(500).json({ message: "Failed to clear data" });
    }
  });

  // Admin CRUD for Users
  app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      const updatedUser = await storage.updateUser(id, userData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      const { passwordHash, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Admin CRUD for Jobs
  app.put("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const jobData = req.body;
      const updatedJob = await storage.updateJob(id, jobData);
      if (!updatedJob) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json(updatedJob);
    } catch (error) {
      console.error("Update job error:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  app.delete("/api/admin/jobs/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteJob(id);
      if (!success) {
        return res.status(404).json({ message: "Job not found" });
      }
      res.json({ message: "Job deleted successfully" });
    } catch (error) {
      console.error("Delete job error:", error);
      res.status(500).json({ message: "Failed to delete job" });
    }
  });

  // Employer verification submission
  app.post(
    "/api/employer/verification",
    requireEmployer,
    async (req: AuthenticatedRequest, res) => {
      try {
        // Handle both JSON and multipart form data
        let barangayPermit, businessPermit;

        if (req.headers["content-type"]?.includes("multipart/form-data")) {
          // Handle multipart form data (files)
          barangayPermit = req.body.barangayPermit;
          businessPermit = req.body.businessPermit;
        } else {
          // Handle JSON with base64 data
          barangayPermit = req.body.barangayPermit;
          businessPermit = req.body.businessPermit;
        }

        if (!barangayPermit || !businessPermit) {
          return res.status(400).json({ message: "Both permits are required" });
        }

        const updatedUser = await storage.updateUser(req.user!, {
          barangayPermit,
          businessPermit,
          verificationStatus: "pending",
          updatedAt: new Date(),
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "Verification documents submitted successfully" });
      } catch (error) {
        console.error("Error submitting verification:", error);
        res.status(500).json({ message: "Failed to submit verification" });
      }
    }
  );

  // Admin verification management routes
  app.get(
    "/api/admin/verification-requests",
    requireAdmin,
    async (req, res) => {
      try {
        const pendingVerifications = await storage.getPendingVerifications();
        res.json(pendingVerifications);
      } catch (error) {
        console.error("Error fetching verification requests:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch verification requests" });
      }
    }
  );

  app.post(
    "/api/admin/verification/:userId/approve",
    requireAdmin,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const updatedUser = await storage.updateUser(userId, {
          verificationStatus: "approved",
          updatedAt: new Date(),
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Send SMS notification to employer
        if (updatedUser.phone) {
          const employerName =
            `${updatedUser.firstName || ""} ${
              updatedUser.lastName || ""
            }`.trim() || updatedUser.email;
          await sendEmployerVerificationApprovalSMS(
            updatedUser.phone,
            employerName
          );
          console.log(
            `Verification approval SMS sent to ${updatedUser.email} at ${updatedUser.phone}`
          );
        } else {
          console.log(
            `No phone number found for user ${updatedUser.email}, skipping SMS notification`
          );
        }

        res.json({ message: "Employer verification approved" });
      } catch (error) {
        console.error("Error approving verification:", error);
        res.status(500).json({ message: "Failed to approve verification" });
      }
    }
  );

  app.post(
    "/api/admin/verification/:userId/reject",
    requireAdmin,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const { reason } = req.body;

        const updatedUser = await storage.updateUser(userId, {
          verificationStatus: "rejected",
          updatedAt: new Date(),
        });

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Send SMS notification to employer
        if (updatedUser.phone) {
          const employerName =
            `${updatedUser.firstName || ""} ${
              updatedUser.lastName || ""
            }`.trim() || updatedUser.email;
          await sendEmployerVerificationRejectionSMS(
            updatedUser.phone,
            employerName,
            reason
          );
          console.log(
            `Verification rejection SMS sent to ${updatedUser.email} at ${updatedUser.phone}`
          );
        } else {
          console.log(
            `No phone number found for user ${updatedUser.email}, skipping SMS notification`
          );
        }

        res.json({ message: "Employer verification rejected" });
      } catch (error) {
        console.error("Error rejecting verification:", error);
        res.status(500).json({ message: "Failed to reject verification" });
      }
    }
  );

  app.get(
    "/api/admin/verification/:userId/documents",
    requireAdmin,
    async (req, res) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = await storage.getUserById(userId);

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({
          barangayPermit: user.barangayPermit,
          businessPermit: user.businessPermit,
        });
      } catch (error) {
        console.error("Error fetching verification documents:", error);
        res.status(500).json({ message: "Failed to fetch documents" });
      }
    }
  );

  // Saved jobs routes
  app.get(
    "/api/jobseeker/saved-jobs",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = await storage.getUserById(req.user!);
        if (!user || user.role !== "jobseeker") {
          return res
            .status(403)
            .json({ message: "Access denied - job seeker role required" });
        }

        const savedJobs = await storage.getSavedJobs(user.id);
        res.json(savedJobs);
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
        res.status(500).json({ message: "Failed to fetch saved jobs" });
      }
    }
  );

  app.post(
    "/api/jobseeker/saved-jobs/:jobId",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = await storage.getUserById(req.user!);
        if (!user || user.role !== "jobseeker") {
          return res
            .status(403)
            .json({ message: "Access denied - job seeker role required" });
        }

        const jobId = parseInt(req.params.jobId);
        const savedJob = await storage.saveJob(user.id, jobId);
        res.json(savedJob);
      } catch (error) {
        console.error("Error saving job:", error);
        res.status(500).json({ message: "Failed to save job" });
      }
    }
  );

  app.delete(
    "/api/jobseeker/saved-jobs/:jobId",
    requireAuth,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = await storage.getUserById(req.user!);
        if (!user || user.role !== "jobseeker") {
          return res
            .status(403)
            .json({ message: "Access denied - job seeker role required" });
        }

        const jobId = parseInt(req.params.jobId);
        const success = await storage.unsaveJob(user.id, jobId);
        res.json({ success });
      } catch (error) {
        console.error("Error removing saved job:", error);
        res.status(500).json({ message: "Failed to remove saved job" });
      }
    }
  );

  // Seed database route (development only)
  app.post("/api/seed", async (req, res) => {
    try {
      if (process.env.NODE_ENV === "production") {
        return res
          .status(403)
          .json({ message: "Seeding not allowed in production" });
      }

      // Import and run seeder
      const { seedDatabase } = await import("./seed");
      await seedDatabase();

      res.json({ message: "Database seeded successfully" });
    } catch (error) {
      console.error("Error seeding database:", error);
      res.status(500).json({ message: "Failed to seed database" });
    }
  });

  // Global error handler - must be last
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("[Error Handler] Caught error:", {
      message: err.message,
      status: err.status || err.statusCode || 500,
      path: req.path,
      method: req.method,
    });

    const status = err.status || err.statusCode || 500;
    res.status(status).json({
      message: err.message || "Internal Server Error",
      error: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
