-- Add Track Number column
ALTER TABLE field_applications
ADD COLUMN track_number VARCHAR(50);

-- Generate Track Numbers for existing applications
UPDATE field_applications
SET track_number =
    'DUWASA-TRK-' ||
    COALESCE(EXTRACT(YEAR FROM application_date)::TEXT,
             EXTRACT(YEAR FROM CURRENT_DATE)::TEXT)
    || '-' ||
    LPAD(application_id::TEXT, 6, '0')
WHERE track_number IS NULL;

-- Make Track Number unique
ALTER TABLE field_applications
ADD CONSTRAINT uk_field_applications_track_number
UNIQUE (track_number);