-- Add record_id column to vehicle_usage_log table
ALTER TABLE vehicle_usage_log ADD COLUMN record_id INTEGER REFERENCES records(id);

-- Create index for better performance
CREATE INDEX idx_vehicle_usage_log_record_id ON vehicle_usage_log(record_id);

-- Update existing vehicle usage logs to link them to records
-- This will match vehicle usage logs to records based on entry_date and created_at order
WITH matched_logs AS (
  SELECT 
    v.id as log_id,
    r.id as record_id,
    ROW_NUMBER() OVER (PARTITION BY v.entry_date ORDER BY v.created_at) as log_rank,
    ROW_NUMBER() OVER (PARTITION BY r.entry_date ORDER BY r.created_at) as record_rank
  FROM vehicle_usage_log v
  JOIN records r ON v.entry_date = r.entry_date
)
UPDATE vehicle_usage_log
SET record_id = (
  SELECT record_id 
  FROM matched_logs 
  WHERE matched_logs.log_id = vehicle_usage_log.id 
    AND matched_logs.log_rank = matched_logs.record_rank
)
WHERE EXISTS (
  SELECT 1 
  FROM matched_logs 
  WHERE matched_logs.log_id = vehicle_usage_log.id 
    AND matched_logs.log_rank = matched_logs.record_rank
);
