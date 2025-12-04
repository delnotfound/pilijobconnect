import { pgTable, text, integer, serial, boolean, timestamp, real, uniqueIndex, varchar, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("jobseeker"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  profileImage: text("profile_image"),
  skills: text("skills"),
  desiredRoles: text("desired_roles"),
  experienceLevel: varchar("experience_level", { length: 50 }),
  preferredLocation: varchar("preferred_location", { length: 255 }),
  isActive: boolean("is_active").notNull().default(true),
  isVerified: boolean("is_verified").default(false),
  verificationStatus: varchar("verification_status", { length: 50 }).default("pending"),
  barangayPermit: text("barangay_permit"),
  businessPermit: text("business_permit"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  salary: varchar("salary", { length: 100 }).notNull(),
  description: text("description").notNull(),
  requirements: text("requirements"),
  requiredSkills: text("required_skills"),
  benefits: text("benefits"),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  employerId: integer("employer_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  applicantCount: integer("applicant_count").notNull().default(0),
  viewCount: integer("view_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  applicantId: integer("applicant_id").references(() => users.id),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address"),
  coverLetter: text("cover_letter"),
  resume: text("resume"),
  status: varchar("status", { length: 50 }).notNull().default("applied"),
  channelId: text("channel_id"),
  notes: text("notes"),
  interviewDate: timestamp("interview_date"),
  interviewTime: varchar("interview_time", { length: 20 }),
  interviewVenue: text("interview_venue"),
  interviewType: varchar("interview_type", { length: 20 }),
  interviewNotes: text("interview_notes"),
  notProceedingReason: text("not_proceeding_reason"),
  smsNotificationSent: boolean("sms_notification_sent").notNull().default(false),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const employers = pgTable("employers", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  description: text("description"),
  logo: text("logo"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  jobCount: integer("job_count").notNull().default(0),
});

export const jobMatches = pgTable("job_matches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  matchScore: real("match_score").notNull(),
  skillMatch: real("skill_match").notNull().default(0),
  locationMatch: real("location_match").notNull().default(0),
  roleMatch: real("role_match").notNull().default(0),
  userFeedback: varchar("user_feedback", { length: 20 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  uniqueJobMatch: uniqueIndex("unique_job_match").on(table.userId, table.jobId),
}));

export const savedJobs = pgTable("saved_jobs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull().references(() => jobs.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  savedAt: timestamp("saved_at").notNull().defaultNow(),
}, (table) => ({
  uniqueSavedJob: uniqueIndex("unique_saved_job").on(table.jobId, table.userId),
}));

export const jobAlerts = pgTable("job_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  keywords: text("keywords"),
  location: varchar("location", { length: 255 }),
  category: varchar("category", { length: 100 }),
  jobType: varchar("job_type", { length: 50 }),
  minSalary: varchar("min_salary", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  frequency: varchar("frequency", { length: 20 }).notNull().default("daily"),
  lastSent: timestamp("last_sent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  jobs: many(jobs),
  applications: many(applications),
  savedJobs: many(savedJobs),
  jobAlerts: many(jobAlerts),
  sessions: many(userSessions),
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
  user: one(users, {
    fields: [userSessions.userId],
    references: [users.id],
  }),
}));

export const jobsRelations = relations(jobs, ({ many, one }) => ({
  applications: many(applications),
  savedBy: many(savedJobs),
  employer: one(users, {
    fields: [jobs.employerId],
    references: [users.id],
  }),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  applicant: one(users, {
    fields: [applications.applicantId],
    references: [users.id],
  }),
}));

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  job: one(jobs, {
    fields: [savedJobs.jobId],
    references: [jobs.id],
  }),
  user: one(users, {
    fields: [savedJobs.userId],
    references: [users.id],
  }),
}));

export const jobAlertsRelations = relations(jobAlerts, ({ one }) => ({
  user: one(users, {
    fields: [jobAlerts.userId],
    references: [users.id],
  }),
}));

export const jobMatchesRelations = relations(jobMatches, ({ one }) => ({
  user: one(users, {
    fields: [jobMatches.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [jobMatches.jobId],
    references: [jobs.id],
  }),
}));

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  applicantCount: true,
  viewCount: true,
  postedAt: true,
  updatedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  smsNotificationSent: true,
  appliedAt: true,
  updatedAt: true,
  status: true,
});

export const updateApplicationSchema = insertApplicationSchema.partial().extend({
  status: z.enum(["applied", "reviewed", "interview_scheduled", "interview_completed", "hired", "not_proceeding"]).optional(),
  notes: z.string().optional(),
  interviewDate: z.union([z.date(), z.string()]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ).optional().nullable(),
  interviewTime: z.string().optional().nullable(),
  interviewVenue: z.string().optional().nullable(),
  interviewType: z.enum(["phone", "video", "in-person"]).optional().nullable(),
  interviewNotes: z.string().optional().nullable(),
  notProceedingReason: z.string().optional().nullable(),
  smsNotificationSent: z.boolean().optional(),
  updatedAt: z.union([z.date(), z.string()]).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ).optional(),
});

export const insertEmployerSchema = createInsertSchema(employers).omit({
  id: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  isActive: true,
  jobCount: true,
});

export const insertSavedJobSchema = createInsertSchema(savedJobs).omit({
  id: true,
  savedAt: true,
});

export const insertJobAlertSchema = createInsertSchema(jobAlerts).omit({
  id: true,
  isActive: true,
  lastSent: true,
  createdAt: true,
});

export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["jobseeker", "employer", "admin"]),
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;
export type UpdateJob = Partial<InsertJob>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type UpdateApplication = z.infer<typeof updateApplicationSchema>;
export type Employer = typeof employers.$inferSelect;
export type InsertEmployer = z.infer<typeof insertEmployerSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type SavedJob = typeof savedJobs.$inferSelect;
export type InsertSavedJob = z.infer<typeof insertSavedJobSchema>;
export type JobAlert = typeof jobAlerts.$inferSelect;
export type InsertJobAlert = z.infer<typeof insertJobAlertSchema>;