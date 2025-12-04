# Local Development Setup for Windows

## Prerequisites
1. Install Node.js (version 18 or higher)
2. Install PostgreSQL for Windows

## PostgreSQL Installation Steps

### Option 1: Install PostgreSQL (Recommended)
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer and remember your password for the 'postgres' user
3. Make sure PostgreSQL service is running

### Option 2: Use Docker (Alternative)
```bash
# If you have Docker installed
docker run --name pili-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=pili_jobs -p 5432:5432 -d postgres:15
```

## Database Setup

### Step 1: Create Database (Using pgAdmin or SQL Shell)
Open SQL Shell (psql) or pgAdmin and run:
```sql
CREATE DATABASE pili_jobs;
```

### Step 2: Environment Configuration
1. Copy `.env.example` to `.env`
2. Update the DATABASE_URL in `.env`:
```
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/pili_jobs
```
Replace `your_password` with the password you set during PostgreSQL installation.

### Step 3: Install Dependencies and Setup
```bash
# Install dependencies
npm install

# Push database schema
npm run db:push

# Seed with sample data (run this in Node.js)
node -e "import('./server/seed.js').then(m => m.seedDatabase())"

# Start the application
npm run dev
```

## Alternative: Use SQLite for Local Development

If PostgreSQL setup is too complex, I can modify the project to use SQLite locally:

1. Install SQLite driver: `npm install better-sqlite3`
2. Modify database configuration for local SQLite file
3. Keep PostgreSQL for production deployment

Would you prefer this simpler approach?

## Recommended: Current Setup

The easiest approach is to continue with the current development environment where everything is already working:
- Database is configured and seeded
- All dependencies are installed
- Application runs without any setup

The application is ready for deployment to any hosting platform.