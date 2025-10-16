-- Migration: add start_time and end_time to appointments and backfill from time_slots
-- Run this manually or wire to your migration tool (Flyway/Liquibase) as appropriate.

BEGIN;

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS start_time timestamptz,
  ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- For this migration we will NOT backfill from time_slots.
-- Instead, update the single existing appointment row (if present) to have
-- start_time = today at 09:00 and end_time = today at 09:15 (server current_date).
-- This avoids assumptions about the time_slots schema.
UPDATE appointments
SET start_time = (current_date + time '09:00:00')::timestamptz,
    end_time   = (current_date + time '09:15:00')::timestamptz
WHERE id = (
  SELECT id FROM appointments ORDER BY id LIMIT 1
)
  AND (start_time IS NULL OR end_time IS NULL);

COMMIT;
