-- Migration to fix the applications table schema
-- This migration adds missing columns and corrects column types

BEGIN;

-- First, let's check and fix the submitted_documents column
-- If it exists and is the wrong type, we need to recreate it

-- Check if submitted_documents exists as boolean and convert it to text
DO $$ 
DECLARE
    col_type TEXT;
BEGIN
    -- Get the current type of submitted_documents column
    SELECT data_type INTO col_type FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'submitted_documents';
    
    IF col_type = 'boolean' THEN
        -- If it's boolean, we need to convert it to text
        ALTER TABLE applications ALTER COLUMN submitted_documents TYPE text USING submitted_documents::text;
    ELSIF col_type IS NULL THEN
        -- If it doesn't exist, create it
        ALTER TABLE applications ADD COLUMN submitted_documents text;
    END IF;
END $$;

-- Add required_documents if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='required_documents') THEN
        ALTER TABLE applications ADD COLUMN required_documents text;
    END IF;
END $$;

-- Add other missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='middle_name') THEN
        ALTER TABLE applications ADD COLUMN middle_name varchar(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='interview_date') THEN
        ALTER TABLE applications ADD COLUMN interview_date timestamp;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='interview_time') THEN
        ALTER TABLE applications ADD COLUMN interview_time varchar(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='interview_venue') THEN
        ALTER TABLE applications ADD COLUMN interview_venue text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='interview_type') THEN
        ALTER TABLE applications ADD COLUMN interview_type varchar(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='interview_notes') THEN
        ALTER TABLE applications ADD COLUMN interview_notes text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='not_proceeding_reason') THEN
        ALTER TABLE applications ADD COLUMN not_proceeding_reason text;
    END IF;
END $$;

-- Ensure channel_id exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='applications' AND column_name='channel_id') THEN
        ALTER TABLE applications ADD COLUMN channel_id text;
    END IF;
END $$;

COMMIT;
