-- Add missing columns to applications table for interview management and additional requirements

-- Only add columns that don't exist yet
ALTER TABLE applications ADD COLUMN IF NOT EXISTS channel_id TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_date TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_time TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_venue TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_type TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS interview_notes TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS not_proceeding_reason TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS additional_requirements_requested BOOLEAN DEFAULT false;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS additional_requirements_requested_at TIMESTAMP;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS valid_id_document TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS nbi_clearance_document TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS personal_data_sheet_document TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS curriculum_vitae_document TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS documents_uploaded_at TIMESTAMP;
