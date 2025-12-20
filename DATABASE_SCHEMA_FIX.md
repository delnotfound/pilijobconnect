# Database Schema Fix for Document Submission

## Problem

When submitting documents through the application, users are getting the PostgreSQL error:
```
Error: invalid input syntax for type boolean
```

This occurs because the `submitted_documents` column in the `applications` table is defined as BOOLEAN instead of TEXT in the actual PostgreSQL database.

## Root Cause

The database schema mismatch:
- **Schema definition** (shared/schema.ts): `submittedDocuments: text("submitted_documents")`
- **Actual database**: `submitted_documents` is defined as BOOLEAN (wrong type)
- **Code behavior**: Tries to insert a JSON string into a boolean column, causing PostgreSQL to fail

## Solution

### Option 1: Automatic Fix (Recommended)

Run the migration script:

```bash
node fix-db-schema.js
```

This script will:
1. Convert the `submitted_documents` column from BOOLEAN to TEXT
2. Add any missing columns (required_documents, interview_date, interview_type, etc.)
3. Ensure all columns have the correct types

### Option 2: Manual Fix

If you have direct database access, you can run the migration SQL manually:

```bash
# Apply the migration
psql -d yourdb < migrations/0001_fix_applications_schema.sql
```

Or in your database GUI/terminal:

```sql
-- Convert submitted_documents from boolean to text
ALTER TABLE applications 
ALTER COLUMN submitted_documents TYPE text USING submitted_documents::text;

-- Add missing columns if they don't exist
ALTER TABLE applications
ADD COLUMN IF NOT EXISTS required_documents text,
ADD COLUMN IF NOT EXISTS middle_name varchar(100),
ADD COLUMN IF NOT EXISTS interview_date timestamp,
ADD COLUMN IF NOT EXISTS interview_time varchar(20),
ADD COLUMN IF NOT EXISTS interview_venue text,
ADD COLUMN IF NOT EXISTS interview_type varchar(20),
ADD COLUMN IF NOT EXISTS interview_notes text,
ADD COLUMN IF NOT EXISTS not_proceeding_reason text,
ADD COLUMN IF NOT EXISTS channel_id text;
```

### Option 3: Using Drizzle Kit

If you have properly configured Drizzle Kit for PostgreSQL:

```bash
npm run db:push
```

## Verification

After applying the fix, verify the schema is correct:

```bash
node verify-db-schema.js
```

Expected output:
```
✅ submitted_documents is TEXT (correct)
✅ required_documents is TEXT (correct)
✅ sms_notification_sent is BOOLEAN (correct)
```

## What Was Fixed

1. **submitted_documents** column: Converted from BOOLEAN to TEXT
   - Now correctly stores JSON stringified object of document mappings
   - Format: `{"passport": "data:image/jpeg;base64...", "id_card": "data:image/jpeg;base64..."}`

2. **required_documents** column: Added if missing
   - Stores JSON stringified array of required document types
   - Format: `["passport", "id_card", "birth_certificate"]`

3. **Missing columns**: Added for interview tracking and document management
   - middle_name
   - interview_date
   - interview_time
   - interview_venue
   - interview_type
   - interview_notes
   - not_proceeding_reason
   - channel_id

## Testing

After applying the fix, test the document submission feature:

1. Log in as a job seeker
2. Navigate to an application with status "additional_docs_required"
3. Click "Submit Documents"
4. Upload the required documents
5. Click "Submit Documents" button
6. You should see a success message and the documents should be stored in the database

## Files Included

- `fix-db-schema.js` - Automatic migration script
- `verify-db-schema.js` - Schema verification script
- `migrations/0001_fix_applications_schema.sql` - Raw SQL migration (for manual application)

## Need Help?

If you encounter any issues:

1. First, run the verification script: `node verify-db-schema.js`
2. Check the DATABASE_URL environment variable is set correctly
3. Ensure you have permission to modify the database schema
4. Check the error message in the console for specific details

## Future Prevention

To prevent this from happening again:

1. Always use `npm run db:push` or Drizzle Kit migrations to sync schema changes
2. Keep the TypeScript schema definitions in sync with actual database
3. Test schema changes in a development environment first
4. Don't manually create or modify database columns without updating the Drizzle schema
