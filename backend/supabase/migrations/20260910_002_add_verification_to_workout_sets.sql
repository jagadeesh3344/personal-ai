-- ====================================================================
-- FRIDAY AI FITNESS TRAINER — ADD VERIFICATION TO WORKOUT SETS MIGRATION
-- ====================================================================

ALTER TABLE public.workout_sets
  ADD COLUMN IF NOT EXISTS completion_method TEXT
    DEFAULT 'MANUAL'
    CHECK (completion_method IN ('CAMERA', 'VOICE', 'MANUAL')),
  ADD COLUMN IF NOT EXISTS verification TEXT
    DEFAULT 'SELF_REPORTED'
    CHECK (verification IN ('VERIFIED', 'SELF_REPORTED')),
  ADD COLUMN IF NOT EXISTS duration_seconds INTEGER,
  ADD COLUMN IF NOT EXISTS resistance_level TEXT;

-- Safely backfill any pre-existing rows where nulls might exist
UPDATE public.workout_sets
SET 
  completion_method = 'MANUAL'
WHERE completion_method IS NULL;

UPDATE public.workout_sets
SET 
  verification = 'SELF_REPORTED'
WHERE verification IS NULL;
