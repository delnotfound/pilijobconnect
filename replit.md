# Pili Jobs - Local Job Board Platform

## Overview

Pili Jobs is a modern web-based job board platform designed specifically for Pili, Camarines Sur. The platform connects local job seekers with employers, featuring job search and filtering, application management, employer verification, and role-based dashboards for job seekers, employers, and administrators.

**Key Features:**
- Job search with filtering by location (barangay-level), category, salary, and keywords
- Application tracking and management
- Employer verification system with document upload
- SMS notifications via TextBee integration
- Job matching and recommendation engine for job seekers
- Admin dashboard with analytics and user management
- Saved jobs and job alerts functionality

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18 with TypeScript for type safety
- Vite for development and build tooling
- TanStack React Query for server state management and data fetching
- Wouter for lightweight client-side routing
- Tailwind CSS for styling with shadcn/ui component library
- Recharts for data visualization in admin dashboard

**Design Patterns:**
- Component-based architecture with reusable UI components
- Custom hooks for authentication (`useAuth`) and toast notifications
- Modal-based workflows for job applications, user profiles, and employer verification
- Role-based UI rendering (job seeker, employer, admin dashboards)
- Centralized API request handling through `queryClient.ts`

**Key Architectural Decisions:**
- **Single-page application** with client-side routing for fast navigation
- **Role-based dashboards** shown conditionally based on authenticated user's role
- **Form validation** using Zod schemas with React Hook Form integration
- **Optimistic updates** and cache invalidation with React Query for responsive UX
- **Mobile-responsive design** with Tailwind CSS breakpoints

### Backend Architecture

**Technology Stack:**
- Express.js with TypeScript for the REST API
- Drizzle ORM for database operations
- SQLite (better-sqlite3) for local data storage
- JWT-based authentication with session management
- bcrypt.js for password hashing
- Zod for request validation

**Design Patterns:**
- **RESTful API design** with clear resource endpoints
- **Middleware-based request processing** (cookie parsing, authentication, logging)
- **Storage layer abstraction** through `DatabaseStorage` class
- **Session-based authentication** with HTTP-only cookies
- **Role-based access control** with middleware guards (`requireAuth`, `requireEmployer`, `requireAdmin`)

**Key Architectural Decisions:**
- **SQLite database** chosen for simplicity and portability in local development
- **Drizzle ORM** provides type-safe database queries and schema management
- **Session storage** uses JWT tokens stored in HTTP-only cookies for security
- **File uploads** converted to base64 and stored directly in database
- **Database schema** uses SQLite-specific features (integer autoincrement, timestamp modes)

**API Structure:**
- `/api/auth/*` - Authentication endpoints (login, register, logout, session validation)
- `/api/jobs/*` - Job CRUD operations with search, filtering, and pagination
- `/api/applications/*` - Job application management
- `/api/jobseeker/*` - Job seeker specific features (saved jobs, recommendations, applications)
- `/api/employer/*` - Employer features (job management, candidate scouting, verification)
- `/api/admin/*` - Admin operations (user management, statistics, verification approval)

### Data Storage

**Database: PostgreSQL (Neon) with Drizzle ORM**

**Migration History:**
- **October 2025**: Migrated from SQLite to PostgreSQL for Vercel serverless compatibility

**Schema Design:**
- **users** - Authentication and user profiles with role-based access (jobseeker, employer, admin)
- **userSessions** - JWT session management with expiration tracking
- **jobs** - Job listings with employer reference and metadata (views, applicants, featured status)
- **applications** - Job applications with applicant details and status tracking
- **employers** - Employer profiles and verification documents
- **categories** - Job categories for filtering
- **savedJobs** - User's saved job listings
- **jobAlerts** - Job alert preferences for notifications
- **jobMatches** - ML-based job matching scores for recommendations

**Key Decisions:**
- **PostgreSQL (Neon)** chosen for serverless compatibility with Vercel deployment
- **Drizzle ORM** provides type safety and migration management
- **Base64 file storage** for resumes and verification documents (simplifies deployment but increases database size)
- **Soft deletes** implemented through `isActive` flags rather than hard deletion
- **Timestamp tracking** on all major entities (createdAt, updatedAt)

### Authentication & Authorization

**Authentication Flow:**
1. User registers with email/password and role selection
2. Password hashed with bcrypt (12 rounds)
3. Login creates JWT session token stored in HTTP-only cookie
4. Session validated on each request via middleware
5. Token expiration checked against database session record

**Authorization Levels:**
- **Public** - Job browsing and search
- **Authenticated** - Job applications, saved jobs, profile management
- **Employer** - Job posting, application management, candidate scouting
- **Admin** - User management, verification approval, system analytics

**Security Measures:**
- HTTP-only cookies prevent XSS attacks
- Password hashing with bcrypt
- Role-based middleware guards on protected routes
- Session expiration (7 days) with database tracking
- CORS configured for development/production environments

## External Dependencies

### SMS Notifications
- **TextBee API** - Cost-effective SMS gateway using Android device
- Used for: Application confirmations, employer notifications, status updates
- Configuration: API key and device ID stored in environment variables
- Free tier: 50 messages/day, 300/month with 1 device

### UI Component Library
- **shadcn/ui** - Radix UI primitives with Tailwind CSS styling
- Provides accessible, customizable components (dialogs, forms, tables, etc.)

### Database & ORM
- **@neondatabase/serverless** - PostgreSQL serverless driver for Vercel
- **Drizzle Kit** - Schema management and migrations
- **Drizzle ORM** - Type-safe database queries with PostgreSQL support

### Development Tools
- **Vite** - Fast development server and build tool
- **ESBuild** - Production bundling
- **TSX** - TypeScript execution for development

## Deployment

### Vercel Deployment (Production)
The application is configured for serverless deployment on Vercel:
- **Serverless API**: All routes handled through `api/[...path].ts`
- **Static Frontend**: Built with Vite to `dist/public`
- **Database**: PostgreSQL (Neon) for serverless compatibility
- **Configuration**: See `vercel.json` and `README.vercel.md`

### Environment Configuration
Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (Neon or other PostgreSQL provider)
- `JWT_SECRET` - Secret key for JWT token signing
- `TEXTBEE_API_KEY` - TextBee SMS service API key (optional)
- `TEXTBEE_DEVICE_ID` - TextBee device identifier (optional)
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 5000)