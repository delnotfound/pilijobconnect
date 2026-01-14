-- Migration to add resume and cover_letter columns to users table
-- This allows job seekers to store their resume and cover letter in their profile

BEGIN;

-- Add resume column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS resume text;

-- Add cover_letter column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS cover_letter text;

COMMIT;
